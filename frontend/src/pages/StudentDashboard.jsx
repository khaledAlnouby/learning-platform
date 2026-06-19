import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { courseId, courseName }
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollRes, notifRes] = await Promise.all([
        api.get('/courses/approved'),
        api.get(`/enrollments/student/${user.id}`),
        api.get(`/notifications/student/${user.id}`),
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      const res = await api.get('/courses/approved');
      setCourses(res.data);
      return;
    }
    const res = await api.get(`/courses/search?keyword=${encodeURIComponent(search)}`);
    // search returns all statuses; keep only approved ones
    setCourses(res.data.filter(c => c.status === 'APPROVED'));
  };

  const requestEnrollment = async (courseId) => {
    await api.post('/enrollments', { courseId, studentId: parseInt(user.id) });
    fetchData();
  };

  const cancelEnrollment = async (enrollmentId) => {
    await api.patch(`/enrollments/${enrollmentId}/cancel`);
    fetchData();
  };

  const markAsRead = async (notifId) => {
    await api.patch(`/notifications/${notifId}/read`);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const getEnrollment = (courseId) =>
    enrollments.find(e => e.courseId === courseId) ?? null;

  const openReview = (course) => {
    setReviewForm({ rating: 5, comment: '' });
    setReviewError('');
    setReviewModal({ courseId: course.id, courseName: course.name });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewError('Rating must be between 1 and 5.');
      return;
    }
    try {
      await api.post('/courses/reviews', {
        courseId: reviewModal.courseId,
        studentId: parseInt(user.id),
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviewModal(null);
      fetchData();
    } catch (err) {
      setReviewError('Failed to submit review. You may have already reviewed this course.');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      PENDING:   { bg: 'rgba(245,158,11,0.15)',  color: 'var(--warning-color)' },
      ACCEPTED:  { bg: 'rgba(16,185,129,0.15)',  color: 'var(--success-color)' },
      REJECTED:  { bg: 'rgba(239,68,68,0.15)',   color: 'var(--danger-color)' },
      CANCELLED: { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-secondary)' },
    };
    const s = colors[status] ?? colors.CANCELLED;
    return (
      <span style={{
        fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem',
        borderRadius: '999px', background: s.bg, color: s.color,
      }}>{status}</span>
    );
  };

  return (
    <div>
      <h1 className="mb-8">Student Dashboard</h1>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4">Notifications</h2>
          <div className="grid gap-4">
            {notifications.slice(0, 5).map(notif => (
              <div key={notif.id} className="glass-panel" style={{
                padding: '1rem 1.25rem',
                borderLeft: notif.read ? '4px solid var(--border-color)' : '4px solid var(--primary-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{notif.message}</p>
                  <small style={{ color: 'var(--text-secondary)' }}>{new Date(notif.timestamp).toLocaleString()}</small>
                </div>
                {!notif.read && (
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => markAsRead(notif.id)}>Mark read</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex justify-between items-center mb-4">
        <h2>Available Courses</h2>
        <div className="flex gap-4">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          {search && (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); fetchData(); }}>Clear</button>
          )}
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-3 gap-4">
        {courses.map(course => {
          const enrollment = getEnrollment(course.id);
          const status = enrollment?.status ?? null;
          const isAccepted = status === 'ACCEPTED';
          const canCancel = status === 'PENDING' || status === 'ACCEPTED';

          return (
            <div key={course.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="flex justify-between items-center">
                <h3 style={{ margin: 0 }}>{course.name}</h3>
                {status && statusBadge(status)}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{course.category}</p>
              <p style={{ fontSize: '0.875rem' }}>Duration: {course.duration}</p>
              <p style={{ fontSize: '0.875rem' }}>
                Spots: {course.enrolledStudents}/{course.capacity}
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                ⭐ {course.rating > 0 ? course.rating.toFixed(1) : 'No ratings yet'}
              </p>

              <div className="flex gap-4 mt-4" style={{ flexWrap: 'wrap' }}>
                {!status && (
                  <button className="btn btn-primary" style={{ flex: 1 }}
                    onClick={() => requestEnrollment(course.id)}>
                    Enroll
                  </button>
                )}
                {canCancel && (
                  <button className="btn btn-danger" style={{ flex: 1 }}
                    onClick={() => cancelEnrollment(enrollment.id)}>
                    Cancel
                  </button>
                )}
                {isAccepted && (
                  <button className="btn btn-secondary" style={{ flex: 1 }}
                    onClick={() => openReview(course)}>
                    ★ Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '480px' }}>
            <h2 className="mb-4">Review: {reviewModal.courseName}</h2>
            <form onSubmit={submitReview}>
              <div className="form-group">
                <label className="form-label">Rating (1 – 5)</label>
                <input
                  type="number" min="1" max="5" className="form-input"
                  value={reviewForm.rating}
                  onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-input" rows={4}
                  placeholder="Share your experience..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
              {reviewError && (
                <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.875rem' }}>{reviewError}</p>
              )}
              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Review</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => setReviewModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
