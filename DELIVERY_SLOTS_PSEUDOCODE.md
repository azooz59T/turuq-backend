# Task 2 — Dynamic Delivery Slot Allocation (Detailed Pseudocode)

Backend logic for a customer app where users book limited-capacity delivery
slots. It must: allocate slots dynamically by availability, **prevent
overbooking**, **suggest alternatives** when the preferred slot is full, and
treat slots as a **shared resource** under concurrent requests.

The design centres on one idea: **fold the capacity check into a single atomic
update**, so "is there room?" and "take a spot" happen as one indivisible write —
no read-then-write race, therefore no overbooking.

---

## Data model

Each slot owns its own capacity, so the overbooking rule is a **single-document
invariant** — exactly what a single atomic update can guard.

```
Slot {
    id
    windowStart, windowEnd   # delivery time window
    zone                     # delivery area
    capacity                 # max orders for this slot
    booked                   # current count, invariant: 0 <= booked <= capacity
    orderIds[]               # orders currently holding this slot
}

Order {
    id
    slotId                   # null until a slot is booked
    status                   # e.g. PENDING, SLOT_BOOKED
}
```

---

## Core booking — atomic and overbooking-proof

```
function bookSlot(orderId, preferredSlotId):

    # 1. Validate the request.
    if orderId is empty or preferredSlotId is empty:
        return Error(400, "orderId and slotId are required")

    order = Orders.findById(orderId)
    if order is null:
        return Error(404, "Order not found")
    if order.slotId is not null:
        return Error(409, "Order already has a delivery slot")   # idempotency guard

    # 2. Atomically claim ONE unit of capacity on the preferred slot.
    #    The capacity check lives INSIDE the filter, so the check + the increment
    #    are a SINGLE atomic document write. Two concurrent bookings can never
    #    both pass a full slot — the loser simply doesn't match the filter.
    claimedSlot = Slots.findOneAndUpdate(
        filter  = { id: preferredSlotId, $expr: { booked < capacity } },
        update  = { booked += 1, orderIds.push(orderId) },
        options = { returnUpdatedDocument: true, writeConcern: "majority" }
    )

    # 3a. Claim succeeded -> link the order and confirm.
    if claimedSlot is not null:
        Orders.updateById(orderId, { slotId: preferredSlotId, status: "SLOT_BOOKED" })
        return Success(200, { slot: claimedSlot, message: "Slot booked" })

    # 3b. Nothing was claimed. Distinguish "missing" from "full".
    if Slots.exists(preferredSlotId) is false:
        return Error(404, "Slot not found")

    # The slot is full -> suggest alternatives.
    alternatives = findAlternativeSlots(preferredSlotId, limit = 5)
    if alternatives is empty:
        return Error(409, "Preferred slot is full and no alternatives are available")
    return Response(409, {
        message:     "Preferred slot is fully booked",
        suggestions: alternatives
    })
```

## Suggest alternatives — available slots nearest the preferred one

```
function findAlternativeSlots(preferredSlotId, limit):
    pref = Slots.findById(preferredSlotId)
    if pref is null:
        return []

    # Only slots that still have room, same delivery zone.
    candidates = Slots.find(
        filter = {
            id:   not preferredSlotId,
            zone: pref.zone,
            $expr: { booked < capacity }        # has remaining capacity
        }
    )

    # Closest in time to what the customer originally wanted, first.
    sort candidates by abs(candidate.windowStart - pref.windowStart) ascending
    return first `limit` candidates
```

## Releasing a slot (cancellation) — the shared resource frees up

```
function cancelBooking(orderId):
    order = Orders.findById(orderId)
    if order is null or order.slotId is null:
        return Error(404, "No booking to cancel")

    # Atomic decrement + detach, mirroring the claim.
    Slots.findOneAndUpdate(
        filter = { id: order.slotId, orderIds contains orderId },
        update = { booked -= 1, orderIds.remove(orderId) }
    )
    Orders.updateById(orderId, { slotId: null, status: "PENDING" })
    return Success(200, "Booking cancelled")
```

## Example

```
result = bookSlot(orderId = "A123", preferredSlotId = "S_18_20")

# -> 200: { slot: {...}, message: "Slot booked" }
# -> 409: { message: "Preferred slot is fully booked",
#           suggestions: [ { id: "S_20_22", windowStart: ... }, ... ] }
```

---

## Concurrency notes — why this is safe, and the trap to avoid

**SAFE — the guard is in the filter.** `findOneAndUpdate` with
`booked < capacity` performs the check and the increment as one atomic write.
The datastore serializes concurrent writes to the same slot document (conflicting
writes are detected and transparently retried), so a full slot can never be
over-incremented. This is a lock-free **compare-and-set**, not a pessimistic
`SELECT ... FOR UPDATE`.

**TRAP — never read-then-write in application code:**
```
slot = findById(id)
if slot.booked < capacity:      # decision on a value that may already be stale
    slot.booked += 1
    save(slot)                  # blindly overwrites -> lost update -> overbooking
```
Two requests can both read `booked = capacity - 1` and both save. If you must
read first, use **optimistic concurrency**: update filtered on a `version` field
and retry when zero documents match.

**DURABILITY.** Acknowledge the write with `writeConcern: "majority"` so a
confirmed booking survives a primary failover and is never rolled back (which
would silently free a seat a customer already holds).

## When one document isn't enough (escalation)

The atomic update guards a **single-document** invariant (one slot's capacity).
Escalate only when correctness crosses a document boundary:

- **Multi-document transaction** — if a booking must atomically do more than the
  slot counter (e.g. also create/settle the `Order`, decrement inventory), wrap
  the slot claim and the other writes in a database transaction, retrying on
  transient write conflicts.
- **Saga** — if the flow spans multiple *services* (payment, delivery,
  notifications), use a saga: each step has a compensating action (e.g. release
  the slot with `booked -= 1`) so a later failure can unwind earlier steps.
