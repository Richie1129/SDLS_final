import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageStudent = ({ projectId }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 取得所有學生資料
    const fetchStudents = async () => {
      try {
        const response = await axios.get('/api/users'); // 假設 API 是 /api/students
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, []);

  // 處理學生選擇
  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prevSelected) => {
      if (prevSelected.includes(studentId)) {
        return prevSelected.filter((id) => id !== studentId);
      } else {
        return [...prevSelected, studentId];
      }
    });
  };

  // 提交選擇的學生
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('/api/projectID', {
        studentIds: selectedStudents,
        projectId,
      });
      alert('學生成功分配到專案');
    } catch (error) {
      console.error('Error assigning students:', error);
      alert('分配失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">學生管理</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            className={`p-4 border rounded-lg shadow-md ${
              selectedStudents.includes(student.id) ? 'bg-blue-100' : ''
            }`}
            onClick={() => handleSelectStudent(student.id)}
          >
            <h2 className="text-lg font-semibold">{student.username}</h2>
            <p className="text-gray-600">ID: {student.id}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || selectedStudents.length === 0}
        className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '提交中...' : '提交分組'}
      </button>
    </div>
  );
};

export default ManageStudent;
