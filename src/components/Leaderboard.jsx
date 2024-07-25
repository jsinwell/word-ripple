import React, { useState, useEffect } from 'react';
import apiUrl from "../config";

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);

    // Fetch our leaderboard data from our backend
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/leaderboard`);
                if (!response.ok) throw new Error('Failed to fetch leaderboard');
                const data = await response.json();
                setLeaderboard(data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            }
        };

        fetchLeaderboard();
    }, []);

    // Display the leaderboard descending by rank (i.e. highest score)
    return (
        <div>
            <h2>Leaderboard</h2>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Score</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry) => (
                        <tr key={entry.user_id}>
                            <td>{entry.rank}</td>
                            <td>{entry.display_name || 'Anonymous'}</td>
                            <td>{entry.score}</td>
                            <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;