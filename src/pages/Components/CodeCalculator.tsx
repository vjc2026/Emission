import { useState } from 'react';
import { Textarea, Button, Group, Text, Card, Title, Divider, Grid } from '@mantine/core'; // Import Mantine components
import styles from './CodeCalculator.module.css';
import axios from 'axios'; // Import axios for making HTTP requests

export default function CodeCalculator() {
  const [code, setCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null); // State to store the result

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => setCode(text));
  };

  const handleDelete = () => {
    setCode('');
    setFile(null);
    setStatus('');
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0] || null;
    setFile(uploadedFile);
    setStatus('Code and file uploaded successfully');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0] || null;
    if (!uploadedFile) return;
  
    const formData = new FormData();
    formData.append('file', uploadedFile);
  
    try {
      const response = await axios.post('http://127.0.0.1:5001/image-to-code', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setCode(response.data.code);
      setStatus('Code extracted from image successfully');
    } catch (error) {
      setStatus('Error extracting code from image');
      console.error(error);
    }
  };

  const handleOptimize = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5001/optimize', {
        code: code
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setStatus('Code optimized successfully');
      const { original_code, optimized_code, changes, metrics } = response.data;
      setResult({ original_code, optimized_code, changes, metrics }); // Store the result
    } catch (error) {
      setStatus('Error optimizing code');
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Code Optimizer</h1>
      <div className={styles.textareaGroup}>
        <Textarea
          value={code}
          onChange={(event) => setCode(event.currentTarget.value)}
          placeholder="Enter your code here"
          autosize
          minRows={4}
          className={styles.textarea}
        />
        <div className={styles.buttonGroup}>
          <Button onClick={handlePaste}>Paste</Button>
          <Button onClick={handleDelete} color="red">Delete</Button>
          <Button component="label" className={styles.uploadButton}>
            Upload Image
            <input type="file" hidden onChange={handleImageUpload} />
          </Button>
          <Button onClick={handleOptimize}>Optimize</Button>
        </div>
      </div>
      <Text mt="sm" className={styles.status}>{status}</Text>
      {result && (
        <div className={styles.result}>
          <Title order={2}>Optimization Result</Title>
          <Divider my="sm" />
          <Card className={styles.resultSection}>
            <Title order={3}>Original Code:</Title>
            <pre className={styles.originalCode}>{result.original_code}</pre>
          </Card>
          <Divider my="sm" />
          <Card className={styles.resultSection}>
            <Title order={3}>Optimized Code:</Title>
            <pre className={styles.optimizedCode}>{result.optimized_code}</pre>
          </Card>
          <Divider my="sm" />
          <div className={styles.resultColumns}>
            <Card className={styles.resultSection}>
              <Title order={3}>Changes Made:</Title>
              <pre className={styles.changes}>{JSON.stringify(result.changes, null, 2)}</pre>
            </Card>
            <Card className={styles.resultSection}>
              <Title order={3}>Metrics:</Title>
              <pre className={styles.metrics}>{JSON.stringify(result.metrics, null, 2)}</pre>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
