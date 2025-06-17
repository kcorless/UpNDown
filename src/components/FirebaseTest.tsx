import { useState, useEffect } from 'react';
import { database } from '../config/firebase';
import { ref, set, onValue } from 'firebase/database';

export function FirebaseTest() {
    const [testMessage, setTestMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    useEffect(() => {
        // Subscribe to test message changes
        const testRef = ref(database, 'test/message');
        const unsubscribe = onValue(testRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setTestMessage(data);
                setSuccess('Successfully received data from Firebase!');
            }
        }, (error) => {
            setError(`Error reading from Firebase: ${error.message}`);
        });

        return () => unsubscribe();
    }, []);

    const handleTestWrite = async () => {
        try {
            const testRef = ref(database, 'test/message');
            const timestamp = new Date().toISOString();
            await set(testRef, `Test message at ${timestamp}`);
            setSuccess('Successfully wrote to Firebase!');
            setError('');
        } catch (err) {
            setError(`Error writing to Firebase: ${err instanceof Error ? err.message : String(err)}`);
            setSuccess('');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <h2>Firebase Connection Test</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={handleTestWrite}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    Test Firebase Write
                </button>
            </div>

            {error && (
                <div style={{ color: 'red', marginBottom: '10px' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ color: 'green', marginBottom: '10px' }}>
                    {success}
                </div>
            )}

            {testMessage && (
                <div style={{ marginTop: '20px' }}>
                    <strong>Last message:</strong> {testMessage}
                </div>
            )}
        </div>
    );
}
