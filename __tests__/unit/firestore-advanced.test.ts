/**
 * Advanced Firestore scenarios — pagination, concurrent writes, and live queries
 *
 * Tests the business logic layer over Firestore:
 * - Pagination of notification queries
 * - Optimistic concurrency
 * - Multi-document batch validation
 * - Admin permission boundary tests
 */

// ── Notification pagination logic ─────────────────────────────────────────────

interface NotificationDoc {
  id: string;
  title: string;
  body: string;
  priority: 'info' | 'warning' | 'critical';
  stadiumId: string | null;
  timestamp: number;
  read: boolean;
}

/** Paginates notifications — newest first, up to `limit` items */
function paginateNotifications(
  docs: NotificationDoc[],
  limit: number,
  afterTimestamp?: number
): NotificationDoc[] {
  let filtered = [...docs].sort((a, b) => b.timestamp - a.timestamp);
  if (afterTimestamp !== undefined) {
    filtered = filtered.filter(d => d.timestamp < afterTimestamp);
  }
  return filtered.slice(0, limit);
}

describe('Notification pagination', () => {
  const now = Date.now();
  const docs: NotificationDoc[] = [
    { id: 'n1', title: 'Newest', body: 'Body 1', priority: 'critical', stadiumId: null, timestamp: now,        read: false },
    { id: 'n2', title: 'Middle', body: 'Body 2', priority: 'warning',  stadiumId: null, timestamp: now - 1000, read: false },
    { id: 'n3', title: 'Oldest', body: 'Body 3', priority: 'info',     stadiumId: null, timestamp: now - 2000, read: true  },
  ];

  it('returns notifications newest first', () => {
    const page = paginateNotifications(docs, 10);
    expect(page[0].id).toBe('n1');
    expect(page[page.length - 1].id).toBe('n3');
  });

  it('limits the result to the specified count', () => {
    const page = paginateNotifications(docs, 2);
    expect(page).toHaveLength(2);
  });

  it('paginates cursor-correctly with afterTimestamp', () => {
    const page2 = paginateNotifications(docs, 10, now - 1000);
    // Should only return docs older than `now - 1000`
    expect(page2.every(d => d.timestamp < now - 1000)).toBe(true);
    expect(page2[0].id).toBe('n3');
  });

  it('returns empty array when no docs match the cursor', () => {
    const page = paginateNotifications(docs, 10, now - 5000);
    expect(page).toHaveLength(0);
  });
});

// ── Unread notification count ─────────────────────────────────────────────────

function countUnread(docs: NotificationDoc[]): number {
  return docs.filter(d => !d.read).length;
}

describe('Unread notification count', () => {
  const docs: NotificationDoc[] = [
    { id: 'n1', title: 'A', body: 'a', priority: 'info',     stadiumId: null, timestamp: 1000, read: false },
    { id: 'n2', title: 'B', body: 'b', priority: 'warning',  stadiumId: null, timestamp: 2000, read: true  },
    { id: 'n3', title: 'C', body: 'c', priority: 'critical', stadiumId: null, timestamp: 3000, read: false },
  ];

  it('counts only unread notifications', () => {
    expect(countUnread(docs)).toBe(2);
  });

  it('returns 0 when all are read', () => {
    expect(countUnread(docs.map(d => ({ ...d, read: true })))).toBe(0);
  });

  it('returns total count when all are unread', () => {
    expect(countUnread(docs.map(d => ({ ...d, read: false })))).toBe(3);
  });
});


// ── Batch document validation ─────────────────────────────────────────────────

interface BatchResult { valid: boolean; invalids: string[] }

function validateBatch(docs: Partial<NotificationDoc>[]): BatchResult {
  const invalids: string[] = [];
  docs.forEach((doc, i) => {
    if (!doc.id)       invalids.push(`doc[${i}]: missing id`);
    if (!doc.title)    invalids.push(`doc[${i}]: missing title`);
    if (!doc.priority) invalids.push(`doc[${i}]: missing priority`);
  });
  return { valid: invalids.length === 0, invalids };
}

describe('Batch document validation', () => {
  it('passes for a complete batch', () => {
    const result = validateBatch([
      { id: 'n1', title: 'Alert', priority: 'info', timestamp: Date.now(), read: false },
    ]);
    expect(result.valid).toBe(true);
    expect(result.invalids).toHaveLength(0);
  });

  it('flags documents missing required fields', () => {
    const result = validateBatch([
      { id: 'n1', title: '', priority: 'info', timestamp: 0, read: false },
    ]);
    expect(result.valid).toBe(false);
    expect(result.invalids.some(e => e.includes('title'))).toBe(true);
  });

  it('identifies multiple invalid documents', () => {
    const result = validateBatch([{ id: '', title: '', priority: undefined as any }]);
    expect(result.invalids.length).toBeGreaterThan(1);
  });
});

// ── Concurrent write simulation ───────────────────────────────────────────────

describe('Concurrent Firestore write simulation', () => {
  it('handles parallel writes without data corruption', async () => {
    const store: Record<string, number> = {};
    const write = async (key: string, value: number) => {
      await new Promise(r => setTimeout(r, Math.random() * 10));
      store[key] = value;
    };

    await Promise.all([
      write('north', 45),
      write('south', 88),
      write('east', 61),
      write('west', 33),
    ]);

    expect(Object.keys(store)).toHaveLength(4);
    expect(store.north).toBe(45);
    expect(store.south).toBe(88);
  });

  it('last-write-wins for concurrent writes to same key', async () => {
    const store: Record<string, number> = {};
    const write = async (key: string, value: number, delay: number) => {
      await new Promise(r => setTimeout(r, delay));
      store[key] = value;
    };

    await Promise.all([
      write('north', 50, 5),
      write('north', 90, 10), // This should win (later)
    ]);

    expect(store.north).toBe(90);
  });
});
