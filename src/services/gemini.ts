import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";

// Initialize the AI client - hardcoded API key for production
const getAI = () => new GoogleGenAI({ apiKey: 'AIzaSyDgidGf6945bsW6TTD7DcV2r0OgNl8-occ' });

export const generateBrandStrategy = async (prompt: string, systemInstruction: string = "You are a world-class beauty brand consultant.") => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: `${systemInstruction} 
      
      重要提示：
      1. 请务必使用 Markdown 表格来展示分类数据、竞品对比、价位带分布等。
      2. 如果涉及数值类数据（如市场份额、价格区间），请在回复末尾提供一个符合以下格式的 JSON 代码块，以便系统渲染图表：
      \`\`\`chart-data
      {
        "type": "bar" | "pie" | "line",
        "title": "图表标题",
        "data": [
          { "name": "类别A", "value": 10 },
          { "name": "类别B", "value": 20 }
        ]
      }
      \`\`\`
      3. 确保分析深度专业，语气优雅且富有洞察力。`,
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text;
};

export const refineContent = async (previousContent: string, refinementPrompt: string, context: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `【当前内容】\n${previousContent}\n\n【用户追问/补充要求】\n${refinementPrompt}\n\n【品牌背景信息】\n${context}`,
    config: {
      systemInstruction: "你是一位世界级的美妆品牌顾问。请根据用户的追问或补充要求，对当前内容进行优化、扩充或解答。你可以选择在原有内容基础上进行修改，或者以对话的形式补充新的见解。请保持专业、优雅且富有洞察力的语气。如果是补充内容，请确保与原有内容逻辑连贯。",
    },
  });
  return response.text;
};

export const generatePackagingDesign = async (prompt: string, base64Image?: string) => {
  const ai = getAI();
  const parts: any[] = [{ text: `High-end beauty product packaging design: ${prompt}. Professional studio photography, elegant lighting, luxury aesthetic.` }];
  
  if (base64Image) {
    // Extract mime type and data from data URL
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      parts.unshift({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateFormulaDesign = async (prompt: string, systemInstruction: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
    },
  });
  return response.text;
};

export const generateProductionSpecs = async (projectName: string, visualIdentity: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `为品牌 "${projectName}" 生成详细的印刷生产技术规范及【Adobe软件技术图纸操作指南】。视觉识别系统参考: ${visualIdentity}。
    请包含以下核心板块：
    1. 印刷参数：CMYK色值、Pantone色号、纸张材质建议、特殊工艺（烫金、UV、击凸）。
    2. Adobe Illustrator/Photoshop 绘图指南：
       - 详细说明如何根据生成的刀版图（Dieline）在软件中建立图层。
       - 标注裁切线（Trim）、出血位（Bleed）、折线（Fold）的颜色与线宽规范。
       - 智能对象与链接文件的管理建议。
    3. 生产交付标准：导出格式（PDF/X-4）、分辨率要求、色彩配置文件。
    请使用严谨的工业级技术文档格式。`,
    config: {
      systemInstruction: "You are a senior print production specialist and digital asset manager. You provide highly technical specifications for luxury beauty packaging, specifically focusing on how to structure editable PSD files for professional manufacturing.",
    },
  });
  return response.text;
};

export const generateMarketingVideo = async (prompt: string, onProgress: (msg: string) => void, base64Image?: string) => {
  const ai = getAI();
  
  onProgress("Initializing video generation...");
  
  let imageConfig: any = undefined;
  if (base64Image) {
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      imageConfig = {
        imageBytes: match[2],
        mimeType: match[1]
      };
    }
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic beauty commercial: ${prompt}. Slow motion, high-end production value, elegant transitions.`,
    image: imageConfig,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    onProgress("Crafting your cinematic commercial... This may take a few minutes.");
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': 'AIzaSyDgidGf6945bsW6TTD7DcV2r0OgNl8-occ',
    },
  });
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
