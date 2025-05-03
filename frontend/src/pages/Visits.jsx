// src/pages/Visits.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchVisits = async () => {
    try {
      const res = await axios.get('http://localhost:3002/api/visits', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setVisits(res.data);
    } catch (err) {
      console.error('Failed to fetch visits');
    }
  };

  const handleAddVisit = async () => {
    try {
      await axios.post(
        'http://localhost:3002/api/visits',
        { hospital, date, reason },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setHospital('');
      setDate('');
      setReason('');
      fetchVisits();
    } catch (err) {
      console.error('Add visit failed');
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hospital Visits</h1>

      <div className="mb-6">
        <input
          className="w-full p-2 border mb-2"
          placeholder="Hospital Name"
          value={hospital}
          onChange={(e) => setHospital(e.target.value)}
        />
        <input
          className="w-full p-2 border mb-2"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="w-full p-2 border mb-2"
          placeholder="Reason for Visit"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button className="bg-blue-600 text-white p-2 w-full" onClick={handleAddVisit}>
          Add Visit
        </button>
      </div>

      <div>
        {visits.map((v, idx) => (
          <div key={idx} className="border p-2 mb-2 rounded shadow">
            <p><strong>Hospital:</strong> {v.hospital}</p>
            <p><strong>Date:</strong> {v.date}</p>
            <p><strong>Reason:</strong> {v.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
