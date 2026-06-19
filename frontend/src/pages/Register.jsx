import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    affiliation: '',
    bio: '',
    yearsOfExperience: 0
  });
  const { register } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({
        ...formData,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0
      });
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex justify-center items-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <h2 className="text-center mb-4">Create an Account</h2>
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" name="name" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" name="email" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" name="password" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input form-select" name="role" onChange={handleChange} value={formData.role}>
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Affiliation</label>
            <input type="text" className="form-input" name="affiliation" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-input" name="bio" onChange={handleChange} rows="3" />
          </div>
          {formData.role === 'INSTRUCTOR' && (
            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input type="number" className="form-input" name="yearsOfExperience" onChange={handleChange} min="0" />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
