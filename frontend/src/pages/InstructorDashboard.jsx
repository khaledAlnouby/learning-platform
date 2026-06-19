import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─── shared helpers ─── */
const statusBadge = (status) => {
  const map = {
    APPROVED: { bg: 'rgba(16,185,129,0.15)',  color: 'var(--success-color)' },
    REJECTED: { bg: 'rgba(239,68,68,0.15)',   color: 'var(--danger-color)'  },
    PENDING:  { bg: 'rgba(245,158,11,0.15)',  color: 'var(--warning-color)' },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '999px', background: s.bg, color: s.color }}>
      {status}
    </span>
  );
};

const StarRating = ({ rating }) => {
  if (!rating || rating === 0) return <span style={{ color: 'var(--text-secondary)' }}>No ratings yet</span>;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: 'var(--warning-color)', letterSpacing: '0.05em' }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginLeft: '0.4rem' }}>({rating.toFixed(1)})</span>
    </span>
  );
};

const thStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' };
const tdStyle = { padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem', verticalAlign: 'middle' };

/* ─── Course Detail Modal ─── */
const CourseDetailModal = ({ course, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${course.id}/reviews`)
      .then(r => setReviews(r.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [course.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ margin: 0 }}>{course.name}</h2>
          {statusBadge(course.status)}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-8" style={{ background: 'rgba(15,23,42,0.4)', borderRadius: '12px', padding: '1.25rem' }}>
          {[
            ['Category',   course.category  ?? '—'],
            ['Duration',   course.duration  ?? '—'],
            ['Capacity',   course.capacity],
            ['Enrolled',   course.enrolledStudents],
          ].map(([label, value]) => (
            <div key={label}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</p>
              <p style={{ fontWeight: 600 }}>{value}</p>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Rating</p>
            <StarRating rating={course.rating} />
          </div>
        </div>

        {/* Reviews */}
        <h3 className="mb-4">Student Reviews ({reviews.length})</h3>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: 'rgba(15,23,42,0.4)', borderRadius: '10px', padding: '1rem' }}>
                <div className="flex justify-between items-center mb-4">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Student #{r.studentId}</span>
                  <span style={{ color: 'var(--warning-color)', fontWeight: 600 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════ */
const InstructorDashboard = () => {
  const { user } = useAuth();

  const [courses, setCourses]                   = useState([]);
  const [allApprovedCourses, setAllApproved]    = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [usersMap, setUsersMap]                 = useState({});
  const [notifications, setNotifications]       = useState([]);

  const [activeTab, setActiveTab]   = useState('courses');
  const [detailCourse, setDetail]   = useState(null);

  // my courses controls
  const [mySearch, setMySearch]     = useState('');
  const [mySort, setMySort]         = useState('none'); // 'none' | 'rating_desc' | 'rating_asc'

  // browse controls
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseCategory, setBrowseCategory] = useState('');
  const [browseSort, setBrowseSort]     = useState('none');

  // create / edit form
  const [showForm, setShowForm]         = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData]         = useState({ name: '', duration: '', category: '', capacity: 0 });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [coursesRes, approvedRes, usersRes, notifRes] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/approved'),
        api.get('/users'),
        api.get(`/notifications/student/${user.id}`),
      ]);

      const myCourses = coursesRes.data.filter(c => c.instructorId === parseInt(user.id));
      setCourses(myCourses);
      setAllApproved(approvedRes.data);
      setNotifications(notifRes.data);

      const map = {};
      usersRes.data.forEach(u => { map[u.id] = u; });
      setUsersMap(map);

      const enrollmentResults = await Promise.all(
        myCourses.map(c => api.get(`/enrollments/course/${c.id}`).catch(() => ({ data: [] })))
      );
      const pending = enrollmentResults
        .flatMap((r, i) => r.data.map(e => ({ ...e, courseName: myCourses[i].name })))
        .filter(e => e.status === 'PENDING');
      setPendingEnrollments(pending);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── actions ── */
  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    await api.post('/courses', { ...formData, instructorId: parseInt(user.id), capacity: parseInt(formData.capacity) });
    cancelForm();
    fetchAll();
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    await api.put(`/courses/${editingCourse.id}`, {
      name: formData.name, duration: formData.duration,
      category: formData.category, capacity: parseInt(formData.capacity),
      instructorId: parseInt(user.id),
    });
    cancelForm();
    fetchAll();
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    await api.delete(`/courses/${courseId}`);
    fetchAll();
  };

  const startEdit = (course) => {
    setEditingCourse(course);
    setFormData({ name: course.name, duration: course.duration ?? '', category: course.category ?? '', capacity: course.capacity });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ name: '', duration: '', category: '', capacity: 0 });
  };

  const handleAccept = async (id) => { await api.patch(`/enrollments/${id}/accept`); fetchAll(); };
  const handleReject = async (id) => { await api.patch(`/enrollments/${id}/reject`); fetchAll(); };

  /* ── derived: my courses with search + sort ── */
  const filteredMyCourses = courses
    .filter(c => {
      if (!mySearch) return true;
      const kw = mySearch.toLowerCase();
      return c.name.toLowerCase().includes(kw) || (c.category ?? '').toLowerCase().includes(kw);
    })
    .sort((a, b) => {
      if (mySort === 'rating_desc') return (b.rating ?? 0) - (a.rating ?? 0);
      if (mySort === 'rating_asc')  return (a.rating ?? 0) - (b.rating ?? 0);
      return 0;
    });

  /* ── derived: browse with search + category + sort ── */
  const browseCategories = [...new Set(allApprovedCourses.map(c => c.category).filter(Boolean))].sort();
  const filteredBrowse = allApprovedCourses
    .filter(c => {
      const kw = browseSearch.toLowerCase();
      const matchSearch = !kw || c.name.toLowerCase().includes(kw) || (c.category ?? '').toLowerCase().includes(kw);
      const matchCat    = !browseCategory || c.category === browseCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (browseSort === 'rating_desc') return (b.rating ?? 0) - (a.rating ?? 0);
      if (browseSort === 'rating_asc')  return (a.rating ?? 0) - (b.rating ?? 0);
      return 0;
    });

  /* ── tab style ── */
  const tabStyle = (t) => ({
    padding: '0.6rem 1.4rem', borderRadius: '8px', cursor: 'pointer',
    border: 'none', fontWeight: 500, fontSize: '0.9rem',
    background: activeTab === t ? 'var(--primary-color)' : 'transparent',
    color: activeTab === t ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  const controlStyle = {
    padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
    background: 'rgba(15,23,42,0.6)', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1>Instructor Dashboard</h1>
        {activeTab === 'courses' && !showForm && (
          <button className="btn btn-primary" onClick={() => { setEditingCourse(null); setShowForm(true); }}>
            + Create New Course
          </button>
        )}
      </div>

      {/* ── Notifications ── */}
      {notifications.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4">Notifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="glass-panel" style={{
                padding: '0.85rem 1.25rem',
                borderLeft: n.read ? '4px solid var(--border-color)' : '4px solid var(--primary-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', margin: 0 }}>{n.message}</p>
                  <small style={{ color: 'var(--text-secondary)' }}>{new Date(n.timestamp).toLocaleString()}</small>
                </div>
                {!n.read && (
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    onClick={() => markAsRead(n.id)}>Mark read</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-4 mb-8" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button style={tabStyle('courses')} onClick={() => setActiveTab('courses')}>My Courses</button>
        <button style={tabStyle('browse')} onClick={() => setActiveTab('browse')}>Browse All Courses</button>
        <button style={tabStyle('enrollments')} onClick={() => setActiveTab('enrollments')}>
          Enrollment Requests
          {pendingEnrollments.length > 0 && (
            <span style={{ marginLeft: '0.5rem', background: 'var(--danger-color)', color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.72rem' }}>
              {pendingEnrollments.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════ MY COURSES ════════════ */}
      {activeTab === 'courses' && (
        <>
          {/* Create / Edit form */}
          {showForm && (
            <div className="glass-panel mb-8" style={{ padding: '2rem' }}>
              <h2 className="mb-4">{editingCourse ? 'Edit Course' : 'New Course'}</h2>
              <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Course Name', key: 'name',     type: 'text'   },
                    { label: 'Category',    key: 'category', type: 'text'   },
                    { label: 'Duration',    key: 'duration', type: 'text'   },
                    { label: 'Capacity',    key: 'capacity', type: 'number' },
                  ].map(({ label, key, type }) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <input type={type} className="form-input" value={formData[key]}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })} required />
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="submit" className="btn btn-primary">
                    {editingCourse ? 'Save Changes' : 'Submit for Approval'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelForm}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Search + Sort controls */}
          {courses.length > 0 && (
            <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
              <input type="text" className="form-input" placeholder="Search by name or category…"
                value={mySearch} onChange={e => setMySearch(e.target.value)} style={{ maxWidth: '280px' }} />
              <select style={controlStyle} value={mySort} onChange={e => setMySort(e.target.value)}>
                <option value="none">Sort: Default</option>
                <option value="rating_desc">Rating: High → Low</option>
                <option value="rating_asc">Rating: Low → High</option>
              </select>
              {(mySearch || mySort !== 'none') && (
                <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}
                  onClick={() => { setMySearch(''); setMySort('none'); }}>Clear</button>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem', alignSelf: 'center' }}>
                {filteredMyCourses.length} of {courses.length} course{courses.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Course cards */}
          {filteredMyCourses.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {courses.length === 0 ? 'No courses yet. Create your first course above.' : 'No courses match your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredMyCourses.map(course => (
                <div key={course.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{course.name}</h3>
                    {statusBadge(course.status)}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{course.category ?? '—'}</p>
                  <p style={{ fontSize: '0.85rem' }}>Duration: <strong>{course.duration ?? '—'}</strong></p>
                  <p style={{ fontSize: '0.85rem' }}>
                    Enrolled: <strong>{course.enrolledStudents}</strong> / {course.capacity}
                  </p>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <StarRating rating={course.rating} />
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '0.45rem' }}
                      onClick={() => setDetail(course)}>Details</button>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '0.45rem' }}
                      onClick={() => startEdit(course)}>Edit</button>
                    <button className="btn btn-danger" style={{ flex: 1, padding: '0.45rem' }}
                      onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════ BROWSE ALL COURSES ════════════ */}
      {activeTab === 'browse' && (
        <>
          {/* Controls */}
          <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
            <input type="text" className="form-input" placeholder="Search by name or category…"
              value={browseSearch} onChange={e => setBrowseSearch(e.target.value)} style={{ maxWidth: '280px' }} />
            <select style={controlStyle} value={browseCategory} onChange={e => setBrowseCategory(e.target.value)}>
              <option value="">All Categories</option>
              {browseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select style={controlStyle} value={browseSort} onChange={e => setBrowseSort(e.target.value)}>
              <option value="none">Sort: Default</option>
              <option value="rating_desc">Rating: High → Low</option>
              <option value="rating_asc">Rating: Low → High</option>
            </select>
            {(browseSearch || browseCategory || browseSort !== 'none') && (
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}
                onClick={() => { setBrowseSearch(''); setBrowseCategory(''); setBrowseSort('none'); }}>Clear</button>
            )}
            <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem', alignSelf: 'center' }}>
              {filteredBrowse.length} course{filteredBrowse.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredBrowse.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No courses found.
            </div>
          ) : (
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Course', 'Category', 'Duration', 'Capacity', 'Enrolled', 'Rating', 'Details'].map(h =>
                      <th key={h} style={thStyle}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredBrowse.map(course => (
                    <tr key={course.id}>
                      <td style={tdStyle}><strong>{course.name}</strong></td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{course.category ?? '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{course.duration ?? '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{course.capacity}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ color: course.enrolledStudents >= course.capacity ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                          {course.enrolledStudents}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}> / {course.capacity}</span>
                      </td>
                      <td style={tdStyle}><StarRating rating={course.rating} /></td>
                      <td style={tdStyle}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.9rem', fontSize: '0.82rem' }}
                          onClick={() => setDetail(course)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════ ENROLLMENT REQUESTS ════════════ */}
      {activeTab === 'enrollments' && (
        <>
          <h2 className="mb-4">Pending Enrollment Requests</h2>
          {pendingEnrollments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No pending enrollment requests.
            </div>
          ) : (
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Student', 'Email', 'Course', 'Requested On', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingEnrollments.map(enr => {
                    const student = usersMap[enr.studentId];
                    return (
                      <tr key={enr.id}>
                        <td style={tdStyle}><strong>{student?.name ?? `Student #${enr.studentId}`}</strong></td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{student?.email ?? '—'}</td>
                        <td style={tdStyle}>{enr.courseName}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {new Date(enr.requestDate).toLocaleDateString()}
                        </td>
                        <td style={tdStyle}>
                          <div className="flex gap-4">
                            <button className="btn btn-secondary" style={{ color: 'var(--success-color)', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
                              onClick={() => handleAccept(enr.id)}>Accept</button>
                            <button className="btn btn-danger" style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
                              onClick={() => handleReject(enr.id)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════ COURSE DETAIL MODAL ════════════ */}
      {detailCourse && (
        <CourseDetailModal course={detailCourse} onClose={() => setDetail(null)} />
      )}
    </div>
  );
};

export default InstructorDashboard;
