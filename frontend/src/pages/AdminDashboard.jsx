import { useEffect, useState } from 'react';
import api from '../services/api';

/* ── tiny helpers ── */
const statusColors = {
  PENDING:  { bg: 'rgba(245,158,11,0.15)',  color: 'var(--warning-color)' },
  APPROVED: { bg: 'rgba(16,185,129,0.15)',  color: 'var(--success-color)' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)',   color: 'var(--danger-color)'  },
};
const roleColors = {
  ADMIN:      { bg: 'rgba(99,102,241,0.15)',  color: 'var(--primary-color)' },
  INSTRUCTOR: { bg: 'rgba(16,185,129,0.15)',  color: 'var(--success-color)' },
  STUDENT:    { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-secondary)' },
};
const Badge = ({ text, scheme }) => (
  <span style={{
    fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.65rem',
    borderRadius: '999px', background: scheme.bg, color: scheme.color,
  }}>{text}</span>
);
const StatCard = ({ label, value, accent }) => (
  <div className="glass-panel" style={{ padding: '1.5rem' }}>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.4rem' }}>{label}</p>
    <p style={{ fontSize: '2rem', fontWeight: 700, color: accent ?? 'var(--text-primary)' }}>{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [courses, setCourses]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [reviews, setReviews]   = useState({}); // { courseId: [reviews] }
  const [activeTab, setActiveTab] = useState('overview');

  // user management state
  const [userSearch, setUserSearch]   = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // course management state
  const [courseSearch, setCourseSearch]     = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('ALL');
  const [editModal, setEditModal]           = useState(null); // course being edited
  const [editForm, setEditForm]             = useState({});

  // analytics state
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === 'analytics' && !reviewsLoaded && courses.length > 0) {
      fetchAllReviews();
    }
  }, [activeTab, courses]);

  const fetchData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        api.get('/courses'),
        api.get('/users'),
      ]);
      setCourses(coursesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const fetchAllReviews = async () => {
    const approvedCourses = courses.filter(c => c.status === 'APPROVED' && c.rating > 0);
    const results = await Promise.all(
      approvedCourses.map(c =>
        api.get(`/courses/${c.id}/reviews`).then(r => ({ id: c.id, data: r.data })).catch(() => ({ id: c.id, data: [] }))
      )
    );
    const map = {};
    results.forEach(({ id, data }) => { map[id] = data; });
    setReviews(map);
    setReviewsLoaded(true);
  };

  /* ── course actions ── */
  const handleStatus = async (courseId, status) => {
    await api.patch(`/courses/${courseId}/status?status=${status}`);
    fetchData();
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Permanently delete this course?')) return;
    await api.delete(`/courses/${courseId}`);
    fetchData();
  };

  const openEdit = (course) => {
    setEditForm({ name: course.name, category: course.category, duration: course.duration, capacity: course.capacity });
    setEditModal(course);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await api.put(`/courses/${editModal.id}`, {
      name: editForm.name,
      category: editForm.category,
      duration: editForm.duration,
      capacity: parseInt(editForm.capacity),
      instructorId: editModal.instructorId, // required by backend
    });
    setEditModal(null);
    fetchData();
  };

  /* ── user actions ── */
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user account?')) return;
    await api.delete(`/users/${userId}`);
    fetchData();
  };

  /* ── derived data ── */
  const instructorMap = Object.fromEntries(
    users.filter(u => u.role === 'INSTRUCTOR').map(u => [u.id, u])
  );

  const filteredUsers = users.filter(u => {
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase())
      || u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchSearch && u.role !== 'ADMIN';
  });

  const filteredCourses = courses.filter(c => {
    const matchStatus = courseStatusFilter === 'ALL' || c.status === courseStatusFilter;
    const matchSearch = !courseSearch
      || c.name.toLowerCase().includes(courseSearch.toLowerCase())
      || (c.category ?? '').toLowerCase().includes(courseSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount   = courses.filter(c => c.status === 'PENDING').length;
  const approvedCount  = courses.filter(c => c.status === 'APPROVED').length;
  const studentCount   = users.filter(u => u.role === 'STUDENT').length;
  const instructorCount = users.filter(u => u.role === 'INSTRUCTOR').length;
  const totalEnrolled  = courses.reduce((s, c) => s + (c.enrolledStudents ?? 0), 0);
  const avgRating      = (() => {
    const rated = courses.filter(c => c.rating > 0);
    return rated.length ? (rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(2) : '—';
  })();

  const topByEnrollment = [...courses].filter(c => c.status === 'APPROVED')
    .sort((a, b) => b.enrolledStudents - a.enrolledStudents).slice(0, 5);
  const topByRating = [...courses].filter(c => c.status === 'APPROVED' && c.rating > 0)
    .sort((a, b) => b.rating - a.rating).slice(0, 5);
  const allReviewsList = Object.values(reviews).flat();

  /* ── shared tab button style ── */
  const tabStyle = (t) => ({
    padding: '0.6rem 1.4rem', borderRadius: '8px', cursor: 'pointer',
    border: 'none', fontWeight: 500, fontSize: '0.9rem',
    background: activeTab === t ? 'var(--primary-color)' : 'transparent',
    color: activeTab === t ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s',
    position: 'relative',
  });

  const thStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' };
  const tdStyle = { padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem', verticalAlign: 'middle' };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1>Admin Dashboard</h1>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-4 mb-8" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
        <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>
          Users
          <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: activeTab === 'users' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
            ({users.filter(u => u.role !== 'ADMIN').length})
          </span>
        </button>
        <button style={tabStyle('courses')} onClick={() => setActiveTab('courses')}>
          Courses
          {pendingCount > 0 && (
            <span style={{ marginLeft: '0.5rem', background: 'var(--warning-color)', color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.72rem' }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button style={tabStyle('analytics')} onClick={() => setActiveTab('analytics')}>Analytics</button>
      </div>

      {/* ════════════════ OVERVIEW ════════════════ */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Students"    value={studentCount}    accent="var(--text-primary)" />
            <StatCard label="Total Instructors" value={instructorCount} accent="var(--text-primary)" />
            <StatCard label="Total Courses"     value={courses.length}  accent="var(--secondary-color)" />
            <StatCard label="Published Courses" value={approvedCount}   accent="var(--success-color)" />
            <StatCard label="Pending Review"    value={pendingCount}    accent="var(--warning-color)" />
            <StatCard label="Total Enrollments" value={totalEnrolled}   accent="var(--primary-color)" />
          </div>

          {pendingCount > 0 && (
            <>
              <h2 className="mb-4">Courses Awaiting Approval</h2>
              <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', marginBottom: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Course', 'Instructor', 'Category', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.filter(c => c.status === 'PENDING').map(course => (
                      <tr key={course.id}>
                        <td style={tdStyle}><strong>{course.name}</strong></td>
                        <td style={tdStyle}>{instructorMap[course.instructorId]?.name ?? `#${course.instructorId}`}</td>
                        <td style={tdStyle}>{course.category ?? '—'}</td>
                        <td style={tdStyle}>
                          <div className="flex gap-4">
                            <button className="btn btn-secondary" style={{ color: 'var(--success-color)', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
                              onClick={() => handleStatus(course.id, 'APPROVED')}>Approve</button>
                            <button className="btn btn-danger" style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
                              onClick={() => handleStatus(course.id, 'REJECTED')}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h2 className="mb-4">Platform Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="mb-4">Users by Role</h3>
              {[{ role: 'STUDENT', count: studentCount }, { role: 'INSTRUCTOR', count: instructorCount }].map(({ role, count }) => (
                <div key={role} className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                  <Badge text={role} scheme={roleColors[role]} />
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="mb-4">Courses by Status</h3>
              {['APPROVED', 'PENDING', 'REJECTED'].map(s => (
                <div key={s} className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                  <Badge text={s} scheme={statusColors[s]} />
                  <strong>{courses.filter(c => c.status === s).length}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ════════════════ USERS ════════════════ */}
      {activeTab === 'users' && (
        <>
          <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
            <input type="text" className="form-input" placeholder="Search by name or email…"
              value={userSearch} onChange={e => setUserSearch(e.target.value)}
              style={{ maxWidth: '300px' }} />
            {['ALL', 'STUDENT', 'INSTRUCTOR'].map(r => (
              <button key={r} onClick={() => setUserRoleFilter(r)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  background: userRoleFilter === r ? 'var(--primary-color)' : 'transparent',
                  color: userRoleFilter === r ? 'white' : 'var(--text-secondary)',
                }}>{r === 'ALL' ? 'All Roles' : r}</button>
            ))}
            <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem', alignSelf: 'center' }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Affiliation', 'Bio', 'Exp (yrs)', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No users found.</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={tdStyle}><strong>{u.name}</strong></td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={tdStyle}><Badge text={u.role} scheme={roleColors[u.role] ?? roleColors.STUDENT} /></td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{u.affiliation ?? '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.bio ?? '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {u.role === 'INSTRUCTOR' ? (u.yearsOfExperience ?? '—') : '—'}
                    </td>
                    <td style={tdStyle}>
                      <button className="btn btn-danger" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handleDeleteUser(u.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ════════════════ COURSES ════════════════ */}
      {activeTab === 'courses' && (
        <>
          <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
            <input type="text" className="form-input" placeholder="Search by name or category…"
              value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
              style={{ maxWidth: '300px' }} />
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setCourseStatusFilter(s)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  background: courseStatusFilter === s ? 'var(--primary-color)' : 'transparent',
                  color: courseStatusFilter === s ? 'white' : 'var(--text-secondary)',
                }}>{s === 'ALL' ? 'All' : s}</button>
            ))}
            <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem', alignSelf: 'center' }}>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Course', 'Instructor', 'Category', 'Duration', 'Capacity', 'Enrolled', 'Rating', 'Status', 'Actions'].map(h =>
                    <th key={h} style={thStyle}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No courses found.</td></tr>
                ) : filteredCourses.map(course => (
                  <tr key={course.id}>
                    <td style={tdStyle}><strong>{course.name}</strong></td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      {instructorMap[course.instructorId]?.name ?? `#${course.instructorId}`}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{course.category ?? '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{course.duration ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{course.capacity}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{course.enrolledStudents}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {course.rating > 0 ? `⭐ ${course.rating.toFixed(1)}` : '—'}
                    </td>
                    <td style={tdStyle}>
                      <Badge text={course.status} scheme={statusColors[course.status]} />
                    </td>
                    <td style={tdStyle}>
                      <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                        {course.status === 'PENDING' && (
                          <>
                            <button className="btn btn-secondary" style={{ color: 'var(--success-color)', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                              onClick={() => handleStatus(course.id, 'APPROVED')}>Approve</button>
                            <button className="btn btn-danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                              onClick={() => handleStatus(course.id, 'REJECTED')}>Reject</button>
                          </>
                        )}
                        {course.status === 'APPROVED' && (
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                            onClick={() => handleStatus(course.id, 'REJECTED')}>Revoke</button>
                        )}
                        {course.status === 'REJECTED' && (
                          <button className="btn btn-secondary" style={{ color: 'var(--success-color)', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                            onClick={() => handleStatus(course.id, 'APPROVED')}>Re-approve</button>
                        )}
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                          onClick={() => openEdit(course)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                          onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ════════════════ ANALYTICS ════════════════ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Avg Platform Rating" value={avgRating}       accent="var(--warning-color)" />
            <StatCard label="Total Enrollments"   value={totalEnrolled}   accent="var(--primary-color)" />
            <StatCard label="Total Reviews"        value={allReviewsList.length} accent="var(--secondary-color)" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Top by Enrollment */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="mb-4">Most Enrolled Courses</h3>
              {topByEnrollment.length === 0
                ? <p style={{ color: 'var(--text-secondary)' }}>No data yet.</p>
                : topByEnrollment.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center" style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '1.2rem' }}>#{i + 1}</span>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{c.category}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{c.enrolledStudents}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>/ {c.capacity}</p>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Top by Rating */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="mb-4">Highest Rated Courses</h3>
              {topByRating.length === 0
                ? <p style={{ color: 'var(--text-secondary)' }}>No ratings yet.</p>
                : topByRating.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center" style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '1.2rem' }}>#{i + 1}</span>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{instructorMap[c.instructorId]?.name ?? '—'}</p>
                      </div>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--warning-color)' }}>⭐ {c.rating.toFixed(1)}</p>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Recent Reviews */}
          {!reviewsLoaded
            ? <p style={{ color: 'var(--text-secondary)' }}>Loading reviews…</p>
            : (
              <>
                <h2 className="mb-4">Recent Reviews</h2>
                {allReviewsList.length === 0
                  ? <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No reviews yet.</div>
                  : (
                    <div className="glass-panel" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Course', 'Student ID', 'Rating', 'Comment'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {allReviewsList.map(r => {
                            const course = courses.find(c => c.id === r.courseId);
                            return (
                              <tr key={r.id}>
                                <td style={tdStyle}>{course?.name ?? `Course #${r.courseId}`}</td>
                                <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                                  {users.find(u => u.id === r.studentId)?.name ?? `#${r.studentId}`}
                                </td>
                                <td style={tdStyle}>{'⭐'.repeat(r.rating)} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({r.rating}/5)</span></td>
                                <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{r.comment || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </>
            )
          }
        </>
      )}

      {/* ════════════════ EDIT COURSE MODAL ════════════════ */}
      {editModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
            <h2 className="mb-4">Edit Course: {editModal.name}</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input type="text" className="form-input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-input" value={editForm.category ?? ''}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input type="text" className="form-input" value={editForm.duration ?? ''}
                  onChange={e => setEditForm({ ...editForm, duration: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input type="number" min="1" className="form-input" value={editForm.capacity}
                  onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} required />
              </div>
              <div className="flex gap-4 mt-4">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => setEditModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
