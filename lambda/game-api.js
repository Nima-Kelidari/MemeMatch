const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'meme-game-scores';

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const { httpMethod, path, body } = event;
    
    // Enable CORS
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };
    
    try {
        switch (httpMethod) {
            case 'OPTIONS':
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'CORS preflight' })
                };
            
            case 'POST':
                if (path === '/submit-score') {
                    return await submitScore(JSON.parse(body), headers);
                }
                break;
            
            case 'GET':
                if (path === '/leaderboard') {
                    return await getLeaderboard(headers);
                }
                break;
            
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
        
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};

async function submitScore(scoreData, headers) {
    const { time, moves, timestamp } = scoreData;
    
    // Generate a unique ID for the score
    const scoreId = `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const item = {
        id: scoreId,
        time: time,
        moves: moves,
        timestamp: timestamp,
        score: calculateScore(time, moves)
    };
    
    const params = {
        TableName: TABLE_NAME,
        Item: item
    };
    
    await dynamodb.put(params).promise();
    
    return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
            message: 'Score submitted successfully',
            scoreId: scoreId,
            score: item.score
        })
    };
}

async function getLeaderboard(headers) {
    const params = {
        TableName: TABLE_NAME
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Sort by score (lower is better) and limit to top 10
    const leaderboard = result.Items
        .sort((a, b) => a.score - b.score)
        .slice(0, 10)
        .map(item => ({
            time: item.time,
            moves: item.moves,
            timestamp: item.timestamp,
            score: item.score
        }));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(leaderboard)
    };
}

function calculateScore(time, moves) {
    // Simple scoring: combine time and moves (lower is better)
    return time + (moves * 2);
}