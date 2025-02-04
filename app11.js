// Full Stack Task Management App (React + Express + MongoDB)

// -------------------- BACKEND (Express + MongoDB) -------------------- //

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { Container, Typography, Button, TextField } from '@mui/material';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';

// MongoDB Connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Task Model
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

// Express Setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.post('/api/tasks', async (req, res) => {
  await connectDB();
  const newTask = new Task(req.body);
  await newTask.save();
  res.status(201).json(newTask);
});

app.get('/api/tasks', async (req, res) => {
  await connectDB();
  const tasks = await Task.find();
  res.status(200).json(tasks);
});

app.put('/api/tasks/:id', async (req, res) => {
  await connectDB();
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedTask);
});

app.delete('/api/tasks/:id', async (req, res) => {
  await connectDB();
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// -------------------- FRONTEND (React) -------------------- //

// React Component (App)
function App() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const response = await axios.get('/api/tasks');
    setTasks(response.data);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/tasks', formData);
    fetchTasks();
    setFormData({ title: '', description: '', dueDate: '' });
  };

  const handleEdit = async (id) => {
    const updatedTask = { 
      title: 'Updated Title',
      description: 'Updated Description',
      dueDate: '2025-02-04',
    };
    await axios.put(`/api/tasks/${id}`, updatedTask);
    fetchTasks();  // Refetch the tasks after update
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/tasks/${id}`);
    fetchTasks();  // Refetch tasks after deletion
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Task Management App
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField name="title" label="Title" fullWidth required value={formData.title} onChange={handleChange} />
        <TextField name="description" label="Description" fullWidth multiline rows={4} value={formData.description} onChange={handleChange} />
        <TextField name="dueDate" label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.dueDate} onChange={handleChange} />
        <Button type="submit" variant="contained" color="primary">Add Task</Button>
      </form>
      <div>
        {tasks.map((task) => (
          <div key={task._id}>
            <Typography variant="h6">{task.title}</Typography>
            <Typography>{task.description}</Typography>
            <Typography>Due Date: {new Date(task.dueDate).toLocaleDateString()}</Typography>
            <Button variant="contained" color="secondary" onClick={() => handleEdit(task._id)}>Edit</Button>
            <Button variant="contained" color="error" onClick={() => handleDelete(task._id)}>Delete</Button>
          </div>
        ))}
      </div>
    </Container>
  );
}

// -------------------- SERVER STARTUP -------------------- //

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// -------------------- DEPLOYMENT INSTRUCTIONS -------------------- //

// Steps for Deploying to Render (Single Link):
// 1. Prepare your project:
//    - Backend (Express) and Frontend (React) in the same GitHub repository.
//    - Make sure Express serves React's build folder in production.

/// React Build in Production:
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// 2. Push the repository to GitHub.
// 3. Deploy both the backend and frontend on **Render** or **Heroku**.
// 4. Set `MONGODB_URI` as an environment variable in the Render/Heroku dashboard.
// 5. Once deployed, you will get a single URL like `https://your-app-name.onrender.com`.

// -------------------- FINISHED -------------------- //

ReactDOM.render(<App />, document.getElementById('root'));
