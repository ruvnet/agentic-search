// server.js
// Import necessary modules
import OpenAI from 'openai';
import { Octokit } from "@octokit/core";
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

// Initialize the Express application
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Octokit for GitHub API interactions
const octokit = new Octokit();

// Determine __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- GET "/" Endpoint --------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- Updated POST "/" Handler --------------------
app.post("/", async (req, res) => {
  const tokenForUser = req.get("X-GitHub-Token");
  const userOctokit = new Octokit({ auth: tokenForUser });

  try {
    const user = await userOctokit.request("GET /user");
    console.log("User:", user.data.login);

    const payload = req.body;
    console.log("Payload:", payload);

    let messages = payload.messages;

    // Add initial system prompts
    messages.unshift({
      role: "system",
      content: `You are a helpful assistant. Please provide clear, informative, and concise responses to the user's queries. Make sure to address the user's questions directly and helpfully.`,
    });
    messages.unshift({
      role: "system",
      content: `Start every response with the user's name, which is @${user.data.login}`,
    });

    // Extract keywords and detect commands from the last 'user' message
    const userMessages = messages.filter(
      (message) => message.role === "user" && message.content
    );
    let keyword = "";
    let isHelpCommand = false;
    let isExaCommand = false;
    let isGithubCommand = false;
    let isOpenAiCommand = false; // New flag for /openai command
    let exaKeywords = "";
    let githubKeywords = "";

    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      const userContent = lastUserMessage.content.trim();

      const lowerCaseContent = userContent.toLowerCase();
      const stopWords = [
        "tell",
        "me",
        "about",
        "the",
        "and",
        "is",
        "a",
        "of",
        "@agentic-co-pilot",
      ];

      // Check if the user message is a help command
      isHelpCommand = /\bhelp\b|\bdocumentation\b|\bguide\b/i.test(
        lowerCaseContent
      );

      // Check if the user message is the /openai command
      if (userContent.startsWith("/openai")) {
        isOpenAiCommand = true;
        console.log("OpenAI command detected");
      }

      // Check if the user message is the /exa command
      else if (userContent.startsWith("/exa")) {
        isExaCommand = true;
        // Extract keywords after /exa
        exaKeywords = userContent.slice(4).trim();
        if (!exaKeywords) {
          exaKeywords = "toronto weather";
        }
        console.log(`Exa command detected with keywords: '${exaKeywords}'`);
      }

      // Check if the user message is the /github command
      else if (userContent.startsWith("/github")) {
        isGithubCommand = true;
        // Extract keywords after /github
        githubKeywords = userContent.slice(7).trim();
        if (!githubKeywords) {
          githubKeywords = "the latest agentic projects";
        }
        console.log(`GitHub command detected with keywords: '${githubKeywords}'`);
      }

      // Only extract keywords if it's not a help command or special command
      if (!isHelpCommand && !isExaCommand && !isGithubCommand && !isOpenAiCommand) {
        keyword = lowerCaseContent
          .split(" ")
          .filter(
            (word) =>
              !stopWords.includes(word) && /^[a-zA-Z0-9.]+$/.test(word)
          )
          .join(" ");
      }
    }

    // Handle help commands
    if (isHelpCommand) {
      if (
        /\bhelp\b/i.test(
          userMessages[userMessages.length - 1].content.toLowerCase()
        )
      ) {
        messages.push({
          role: "system",
          content: `Format with markdown and BBS style formatting: Welcome to the Agentic Copilot Help System. Here are the sections you can explore:
[1] Keyword Search
[2] Site-specific Search
[3] Set Language
[4] Cache Control
[5] Proxy URL
[6] Return Format
[7] Cookies
[8] Additional Guidance
To select a section, simply type the corresponding number or keyword.`,
        });
      }

      if (
        /\bguide\b|\bdocumentation\b/i.test(
          userMessages[userMessages.length - 1].content.toLowerCase()
        )
      ) {
        messages.push({
          role: "system",
          content: `Format with markdown and BBS style formatting: Here is the Agentic Copilot Guide. Please choose from the following topics to get more detailed guidance:
[1] How to use Keyword Search
[2] Setting up Site-specific Search
[3] Changing Language Settings
[4] Managing Cache Control
[5] Configuring Proxy URL
[6] Setting Return Format
[7] Using Cookies for Session Management
[8] Getting Additional Guidance
Type the corresponding number or topic name to proceed.`,
        });
      }
    }

    // Handle /openai command 
    else if (isOpenAiCommand) {
      try {
        console.log("Processing /openai command");

        // Extract the prompt after /openai
        const lastUserMessage = userMessages[userMessages.length - 1];
        const userContent = lastUserMessage.content.trim();
        const openAiPrompt = userContent.slice(7).trim(); // Remove '/openai' and trim

        if (!openAiPrompt) {
          return res.status(400).json({ error: "Please provide a prompt after '/openai'." });
        }

        // Prepare messages for OpenAI
        const openAIMessages = [
          {
            role: "system",
            content: "You are a knowledgeable assistant that provides clear and concise explanations without mentioning that you are an AI language model.",
          },
          {
            role: "user",
            content: openAiPrompt,
          },
        ];

        // Make the request to OpenAI's Chat Completion API
        const chatCompletion = await openai.chat.completions.create({
          model: "o1-mini",
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 1500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });

        // Extract the assistant's reply from OpenAI
        const assistantMessage = chatCompletion.data.choices[0].message.content.trim();

        // Log the assistant's message for debugging
        console.log("Assistant message from OpenAI:", assistantMessage);

        // Prepare messages for Copilot
        messages.push({
          role: "user",
          content: assistantMessage,
        });
      } catch (error) {
        console.error("Error processing /openai command:", error);
        messages.push({
          role: "system",
          content:
            "Unable to process the /openai command at the moment. Please try again later.",
        });
      }
    }

    // Handle /github command
    else if (isGithubCommand) {
      try {
        console.log("Making request to Exa AI API for GitHub search");
        const requestUrl = `https://api.exa.ai/search`;

        const apiKey = process.env.EXA_API_KEY;
        if (!apiKey) {
          throw new Error("EXA_API_KEY is not set in environment variables");
        }

        const requestBody = {
          query: githubKeywords,
          type: "auto",
          numResults: 20,
          startPublishedDate: "2023-01-01",
          category: "github",
          livecrawl: "always",
          contents: {
            summary: {
              query: "overview of github repo",
            },
          },
        };

        console.log("Request Body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        const responseBody = await response.text();

        if (!response.ok) {
          console.error(
            "Exa AI API request failed with status",
            response.status
          );
          console.error("Response Body:", responseBody);
          throw new Error(
            `Exa AI API request failed with status ${response.status}: ${responseBody}`
          );
        }

        let exaData = JSON.parse(responseBody);
        console.log("Exa AI API Response Data:", exaData);

        if (!exaData.results || exaData.results.length === 0) {
          console.error(
            `Exa AI API returned no results for '${githubKeywords}'`
          );
          throw new Error(
            `Exa AI API returned no results for '${githubKeywords}'`
          );
        }

        const exaDataString = exaData.results
          .map((result) => {
            return `Repository: ${result.title}\nDescription: ${result.summary}\nURL: ${result.url}\n`;
          })
          .join("\n");

        console.log("Formatted Exa AI Data String:", exaDataString);

        const maxTokens = 8000;
        let truncatedExaDataString = exaDataString;
        if (exaDataString.length > maxTokens) {
          truncatedExaDataString =
            exaDataString.substring(0, maxTokens) + "... [truncated]";
        }

        messages.push({
          role: "system",
          content: `You have information about GitHub repositories related to '${githubKeywords}'. Please summarize this information clearly, and ensure it is helpful and informative. Be complete, verbose with citations and references. Use markdown for formatting.`,
        });
        messages.push({
          role: "user",
          content: `Here is some information about '${githubKeywords}':\n\n${truncatedExaDataString}`,
        });
      } catch (error) {
        console.error("Error fetching information using Exa AI API:", error);
        messages.push({
          role: "system",
          content:
            "Unable to fetch information at the moment. Please proceed with the current context.",
        });
      }
    }

    // Handle /exa command
    else if (isExaCommand) {
      try {
        console.log("Making request to Exa AI API with dynamic keywords");
        const requestUrl = `https://api.exa.ai/search`;

        const apiKey = process.env.EXA_API_KEY;
        if (!apiKey) {
          throw new Error("EXA_API_KEY is not set in environment variables");
        }

        const requestBody = {
          query: exaKeywords,
          type: "auto",
          numResults: 25,
          startPublishedDate: "2023-01-01",
          category: "news",
          livecrawl: "always",
          contents: {
            text: true,
            summary: {},
          },
        };

        console.log(
          "Request Body:",
          JSON.stringify(requestBody, null, 2)
        );

        const response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        const responseBody = await response.text();

        if (!response.ok) {
          console.error(
            "Exa AI API request failed with status",
            response.status
          );
          console.error("Response Body:", responseBody);
          throw new Error(
            `Exa AI API request failed with status ${response.status}: ${responseBody}`
          );
        }

        let exaData = JSON.parse(responseBody);
        console.log("Exa AI API Response Data:", exaData);

        if (!exaData.results || exaData.results.length === 0) {
          console.error(
            `Exa AI API returned no results for '${exaKeywords}'`
          );
          throw new Error(
            `Exa AI API returned no results for '${exaKeywords}'`
          );
        }

        const exaDataString = exaData.results
          .map((result) => {
            return `Title: ${result.title}\nSummary: ${result.summary}\nURL: ${result.url}\n`;
          })
          .join("\n");

        console.log("Formatted Exa AI Data String:", exaDataString);

        const maxTokens = 8000;
        let truncatedExaDataString = exaDataString;
        if (exaDataString.length > maxTokens) {
          truncatedExaDataString =
            exaDataString.substring(0, maxTokens) + "... [truncated]";
        }

        messages.push({
          role: "system",
          content: `You have information about '${exaKeywords}'. Please summarize this information clearly, and ensure it is helpful and informative. Be complete, verbose with citations and references. Use markdown for formatting.`,
        });
        messages.push({
          role: "user",
          content: `Here is some information about '${exaKeywords}':\n\n${truncatedExaDataString}`,
        });
      } catch (error) {
        console.error("Error fetching information using Exa AI API:", error);
        messages.push({
          role: "system",
          content:
            "Unable to fetch information at the moment. Please proceed with the current context.",
        });
      }
    }

    // Handle keyword search with Jina AI
    else if (keyword) {
      try {
        console.log(`Making request to Jina API with keyword: '${keyword}'`);
        const requestUrl = `https://s.jina.ai/${encodeURIComponent(keyword)}`;
        console.log(`Request URL: ${requestUrl}`);
        const response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.JINA_AI_API}`,
            "X-Return-Format": "markdown",
          },
        });
        if (!response.ok) {
          const errorBody = await response.text();
          console.error("Jina API Error Response:", errorBody);
          throw new Error(
            `Jina API request failed with status ${response.status}: ${errorBody}`
          );
        }
        let searchData = await response.text();
        console.log("Jina API Response Data:", searchData);
        const maxTokens = 8000;
        if (searchData.length > maxTokens) {
          searchData = searchData.substring(0, maxTokens) + "... [truncated]";
        }
        messages.push({
          role: "system",
          content: `You have information about the keyword: '${decodeURIComponent(
            keyword
          )}'. Please summarize this information clearly, and ensure it is helpful and informative. Be complete, verbose with citations and references. Use markdown for formatting.`,
        });
        messages.push({
          role: "user",
          content: `Here is some information about '${decodeURIComponent(
            keyword
          )}': ${searchData}`,
        });
      } catch (error) {
        console.error("Error fetching information using Jina API:", error);
        messages.push({
          role: "system",
          content:
            "Unable to fetch information at the moment. Please proceed with the current context.",
        });
      }
    }

    // Add final guidance to messages
    messages.push({
      role: "system",
      content: `Please provide a clear and complete response using markdown, and ensure you echo the original message clearly so the user knows what was asked. Start the response with the user's name, which is @${user.data.login}. Be verbose with citations and references. Use markdown for formatting.`,
    });

    // Validate messages before making the final request
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid or empty messages array in payload");
    }

    console.log(
      "Messages sent to Copilot API:",
      JSON.stringify(messages, null, 2)
    );

    // Make the final request to Copilot
    const copilotLLMResponse = await fetch(
      "https://api.githubcopilot.com/chat/completions",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${tokenForUser}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
          stream: true,
        }),
      }
    );

    if (!copilotLLMResponse.ok) {
      const errorBody = await copilotLLMResponse.text();
      console.error("Copilot API Error Response:", errorBody);
      throw new Error(
        `Copilot LLM request failed with status ${copilotLLMResponse.status}: ${errorBody}`
      );
    }

    // Stream the response back to the user
    copilotLLMResponse.body.pipe(res);
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).send(`An error occurred: ${error.message}`);
  }
});

// -------------------- Existing GET "/exa" Endpoint --------------------
app.get("/exa", async (req, res) => {
  res.send(
    "This endpoint is now handled via the / POST handler with the /exa command."
  );
});

// -------------------- Existing GET "/github" Endpoint --------------------
app.get("/github", async (req, res) => {
  res.send(
    "This endpoint is now handled via the / POST handler with the /github command."
  );
});

// -------------------- Start the Server --------------------
const port = Number(process.env.PORT || "3000");
app.listen(port, () => {
  console.log("==========================================");
  console.log("🚀  Agentic Copilot Extension Server Started!");
  console.log("🚀  Createb by rUv, cause he could");
  console.log(`🌐  Access the server at: http://localhost:${port}`);
//console.log("📄  API Documentation available at: http://localhost:" + port + "/docs");
  console.log("==========================================");
});
