// index.mjs
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

const region = "us-west-2";
const ddbClient = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = "meme-match-scores";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  const { httpMethod, path, body } = event;

  try {
    if (httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "CORS preflight" })
      };
    }

    if (httpMethod === "POST" && path === "/submit-score") {
      return await submitScore(JSON.parse(body));
    }

    if (httpMethod === "GET" && path === "/leaderboard") {
      return await getLeaderboard();
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not found" })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error", details: error.message })
    };
  }
};

async function submitScore(scoreData) {
  const { time, moves, timestamp } = scoreData;
  const scoreId = `score-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const item = {
    id: scoreId,
    time,
    moves,
    timestamp,
    score: calculateScore(time, moves)
  };

  await dynamodb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  }));

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      message: "Score submitted successfully",
      scoreId,
      score: item.score
    })
  };
}

async function getLeaderboard() {
  const result = await dynamodb.send(new ScanCommand({
    TableName: TABLE_NAME
  }));

  const leaderboard = (result.Items || [])
    .sort((a, b) =>  b.score - a.score) 
    .slice(0, 10)
    .map(({ time, moves, timestamp, score }) => ({
      time, moves, timestamp, score
    }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(leaderboard)
  };
}

function calculateScore(time, moves) {
  return time + moves * 2;
}