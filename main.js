// DOM 元素
const apiKeyInput = document.getElementById("apiKeyInput");
const imageDescInput = document.getElementById("imageDescription");
const systemPromptInput = document.getElementById("systemPrompt");
const updatePromptBtn = document.getElementById("updatePromptBtn");
const chatHistory = document.getElementById("chatHistory");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const loading = document.getElementById("loading");

// 儲存聊天歷史
let chatMessages = [];

// 設定預設的圖片描述
const defaultImageDescription = `在陽光明媚的午後，學校的操場上，小朋友們正在進行一場激烈的球賽。突然，一隻小白狗跑了進來，牠在球場上追逐著足球，搞得大家哈哈大笑。小明興奮地說：「看！小白狗也想做球星！」小華則笑著喊：「快來！讓牠和我們一起踢！」大家都圍著小白狗，享受這難得的歡樂時光。`;

// 設定預設的 system prompt
let systemPrompt = `你現在是一位專業的普通話老師，以繁體字或英文教學，正在與一位小學生進行看圖說故事的口語練習。

你的教學目標是：
1. 培養學生完整描述圖片的能力
2. 訓練學生按照「開頭、發展、結尾」的順序講述故事
3. 引導學生注意圖片中的細節和人物情感

你的指導方式是：
1. 先讓學生自由描述
2. 根據學生的描述和圖片文本內容進行對比：
   - 肯定學生已經描述到的內容
   - 溫和地指出遺漏的重要細節
   - 提供具體的詞彙建議
   - 請學生完整重述一遍
3. 在學生補充了新內容後：   
   - 按時間順序或空間順序組織語言
   - 使用更豐富的形容詞和連接詞
   - 再次請學生完整重述一遍

注意事項：
1. 使用正確的普通話表達
2. 保持鼓勵的語氣
3. 每次回應控制在2-3句話
4. 一次只關注1-2個改進點
5. 每當學生補充了新的描述後，都要引導學生重新完整描述一遍
6. 回覆時，不要包含「等待學生補充後」和「等待學生描述後」等部署訊息，直接回覆即可，以免學生混淆
7. 特別注意引導學生：
   - 描述圖片的整體場景
   - 說明人物的動作和表情
   - 描述事件發生的順序
   - 表達故事中的情感

圖片的實際內容是：
{imageDescription}`;

let currentImageDescription = defaultImageDescription; // 使用預設的圖片描述

// 更新聊天記錄顯示
function updateChatHistory() {
  chatHistory.innerHTML = chatMessages
    .map(
      (msg) => `
        <div class="mb-4 ${msg.role === "user" ? "text-right" : ""}">
            <div class="inline-block max-w-[80%] ${
              msg.role === "user" ? "bg-blue-100" : "bg-white"
            } rounded-lg px-4 py-2 shadow">
                <div class="font-bold ${
                  msg.role === "user" ? "text-blue-700" : "text-gray-700"
                } mb-1">
                    ${msg.role === "user" ? "您" : "AI"}
                </div>
                <div class="text-gray-700 whitespace-pre-wrap">${
                  msg.content
                }</div>
            </div>
        </div>
    `
    )
    .join("");
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 更新 System Prompt
function updateSystemPrompt() {
  const imageDesc = imageDescInput.value.trim() || defaultImageDescription;
  if (imageDesc !== currentImageDescription) {
    currentImageDescription = imageDesc;
    // 將圖片描述插入到 system prompt 中
    console.log("currentImageDescription", currentImageDescription);
    const updatedPrompt = systemPrompt.replace(
      "{imageDescription}",
      currentImageDescription
    );
    chatMessages = []; // 清空聊天記錄
    updateChatHistory();
    console.log("updatedPrompt", updatedPrompt);
    return updatedPrompt;
  }
  return systemPrompt.replace("{imageDescription}", currentImageDescription);
}

// 發送API請求
async function sendChatRequest(messages, apiKey) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "請求失敗");
  }

  return response.json();
}

// 發送訊息
async function sendMessage() {
  const message = userInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!message) {
    alert("請輸入訊息");
    return;
  }

  if (!apiKey) {
    alert("請輸入 API Key");
    return;
  }

  if (!currentImageDescription) {
    alert("請先輸入圖片描述");
    return;
  }

  try {
    loading.classList.remove("hidden");
    sendBtn.disabled = true;
    userInput.disabled = true;

    // 添加用戶訊息到聊天記錄
    chatMessages.push({
      role: "user",
      content: message,
    });
    updateChatHistory();
    userInput.value = "";

    // 準備完整的訊息陣列
    const messages = [
      {
        role: "system",
        content: updateSystemPrompt(),
      },
      ...chatMessages,
    ];

    // 發送請求
    const completion = await sendChatRequest(messages, apiKey);

    // 添加AI回應到聊天記錄
    const aiResponse = completion.choices[0].message.content;
    chatMessages.push({
      role: "assistant",
      content: aiResponse,
    });
    updateChatHistory();
  } catch (error) {
    console.error("錯誤：", error);
    alert("發送訊息時發生錯誤：" + error.message);
  } finally {
    loading.classList.add("hidden");
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

// 更新圖片描述按鈕點擊處理
updatePromptBtn.addEventListener("click", () => {
  const newPrompt = updateSystemPrompt();
  if (newPrompt !== systemPrompt) {
    alert("圖片描述已更新，聊天記錄已重置");
  }
});

// 發送按鈕點擊處理
sendBtn.addEventListener("click", sendMessage);

// 按Enter鍵發送訊息
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 初始化頁面
document.addEventListener("DOMContentLoaded", () => {
  if (systemPromptInput) {
    systemPromptInput.value = systemPrompt;
  }
  if (imageDescInput) {
    imageDescInput.value = defaultImageDescription;
  }
  if (apiKeyInput) {
    apiKeyInput.focus();
  }
  // 初始化時更新一次 system prompt
  updateSystemPrompt();
});
