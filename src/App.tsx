/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BarChart3, 
  BookOpen, 
  Palette, 
  Package, 
  Video, 
  ChevronRight, 
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Send,
  RefreshCw,
  FlaskConical,
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  History as HistoryIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { BrandProject, BrandStage, ChatMessage } from './types';
import { generateBrandStrategy, generatePackagingDesign, generateMarketingVideo, generateProductionSpecs, refineContent, generateFormulaDesign } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STAGES: { id: BrandStage; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'market-analysis', label: '市场分析', icon: <BarChart3 className="w-5 h-5" />, description: '深度洞察行业趋势与竞争格局' },
  { id: 'brand-story', label: '品牌故事', icon: <BookOpen className="w-5 h-5" />, description: '构建动人心弦的品牌内核与叙事' },
  { id: 'formula-design', label: '配方设计', icon: <FlaskConical className="w-5 h-5" />, description: '专业化的化妆品配方研发与设计' },
  { id: 'visual-identity', label: '视觉识别', icon: <Palette className="w-5 h-5" />, description: '定义品牌美学与视觉语言' },
  { id: 'packaging-design', label: '包装设计', icon: <Package className="w-5 h-5" />, description: '创意产品包装渲染与生产文件' },
  { id: 'marketing-video', label: '营销短视频', icon: <Video className="w-5 h-5" />, description: '生成电影级产品推广视频' },
];

export default function App() {
  const [project, setProject] = useState<BrandProject>({
    name: '',
    targetAudience: '',
    salesChannels: '',
    salesRegions: '',
    painPoints: '',
    coreValues: '',
    history: {},
    currentVersion: {},
  });
  const [currentStage, setCurrentStage] = useState<BrandStage>('market-analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  
  // Refinement states
  const [refinementInputs, setRefinementInputs] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Hardcoded API key is available in production
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const startNewSession = (stage: BrandStage) => {
    setProject(prev => {
      const next = { ...prev };
      const currentData: any = {};
      
      // Capture current stage data
      if (stage === 'market-analysis') currentData.marketAnalysis = prev.marketAnalysis;
      if (stage === 'brand-story') currentData.brandStory = prev.brandStory;
      if (stage === 'formula-design') currentData.formulaDesign = prev.formulaDesign;
      if (stage === 'visual-identity') {
        currentData.visualIdentity = prev.visualIdentity;
        currentData.visualIdentityImage = prev.visualIdentityImage;
      }
      if (stage === 'packaging-design') {
        currentData.packagingDesign = prev.packagingDesign;
        currentData.packagingImage = prev.packagingImage;
      }
      if (stage === 'marketing-video') currentData.marketingVideoUrl = prev.marketingVideoUrl;

      // Add to history if it has content
      const hasContent = Object.values(currentData).some(v => v !== undefined && v !== null);
      if (hasContent) {
        const stageHistory = prev.history[stage] || [];
        next.history = {
          ...prev.history,
          [stage]: [...stageHistory, { ...currentData, timestamp: Date.now() }]
        };
      }

      // Clear current stage data
      if (stage === 'market-analysis') next.marketAnalysis = undefined;
      if (stage === 'brand-story') next.brandStory = undefined;
      if (stage === 'formula-design') next.formulaDesign = undefined;
      if (stage === 'visual-identity') {
        next.visualIdentity = undefined;
        next.visualIdentityImage = undefined;
      }
      if (stage === 'packaging-design') {
        next.packagingDesign = undefined;
        next.packagingImage = undefined;
      }
      if (stage === 'marketing-video') next.marketingVideoUrl = undefined;

      next.currentVersion = { ...prev.currentVersion, [stage]: undefined };
      return next;
    });
    // Clear custom inputs for this stage
    setCustomInputs(prev => ({ ...prev, [stage]: '' }));
  };

  const switchVersion = (stage: BrandStage, index: number | 'current') => {
    setProject(prev => {
      const next = { ...prev };
      const stageHistory = prev.history[stage] || [];
      
      // If switching from current to a history version, we might want to save current first?
      // For simplicity, let's assume "New" button handles saving.
      
      let targetData;
      if (index === 'current') {
        // This logic is a bit tricky if we cleared it. 
        // Usually we'd just stay in the current "new" session.
        return prev;
      } else {
        targetData = stageHistory[index];
      }

      if (targetData) {
        if (stage === 'market-analysis') next.marketAnalysis = targetData.marketAnalysis;
        if (stage === 'brand-story') next.brandStory = targetData.brandStory;
        if (stage === 'formula-design') next.formulaDesign = targetData.formulaDesign;
        if (stage === 'visual-identity') {
          next.visualIdentity = targetData.visualIdentity;
          next.visualIdentityImage = targetData.visualIdentityImage;
        }
        if (stage === 'packaging-design') {
          next.packagingDesign = targetData.packagingDesign;
          next.packagingImage = targetData.packagingImage;
        }
        if (stage === 'marketing-video') next.marketingVideoUrl = targetData.marketingVideoUrl;
        
        next.currentVersion = { ...prev.currentVersion, [stage]: index };
      }

      return next;
    });
  };

  const handleRefine = async (stage: BrandStage | 'production-file') => {
    const prompt = refinementInputs[stage];
    if (!prompt) return;

    setIsLoading(true);
    setLoadingMsg('正在根据您的反馈进行优化...');
    try {
      let currentContent = '';
      let context = `Brand: ${project.name}, Audience: ${project.targetAudience}, Channels: ${project.salesChannels}, Regions: ${project.salesRegions}, Pain Points: ${project.painPoints}`;
      
      if (stage === 'market-analysis') {
        currentContent = project.marketAnalysis?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'brand-story') {
        currentContent = project.brandStory?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'formula-design') {
        currentContent = project.formulaDesign?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'visual-identity') {
        currentContent = project.visualIdentity?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else if (stage === 'packaging-design') {
        currentContent = project.packagingDesign?.map(m => `${m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`).join('\n\n') || '';
      } else {
        switch(stage) {
          case 'production-file': currentContent = project.productionSpecs || ''; break;
        }
      }

      let result = '';
      let newImageUrl: string | null | undefined = undefined;

      if (stage === 'visual-identity') {
        const imagePrompt = `Update the visual identity moodboard for "${project.name}" based on: ${prompt}. Maintain luxury beauty aesthetic.`;
        const [textResult, imageUrl] = await Promise.all([
          refineContent(currentContent, prompt, context),
          generatePackagingDesign(imagePrompt)
        ]);
        result = textResult;
        newImageUrl = imageUrl;
      } else if (stage === 'packaging-design') {
        const imagePrompt = `Update packaging design for "${project.name}" based on: ${prompt}. High-end beauty product.`;
        const [textResult, imageUrl] = await Promise.all([
          refineContent(currentContent, `${prompt} (请注意：文字说明请言简意赅，字数限制在500字以内)`, context),
          generatePackagingDesign(imagePrompt, project.packagingReferenceImage)
        ]);
        result = textResult;
        newImageUrl = imageUrl;
      } else {
        result = await refineContent(currentContent, prompt, context);
      }
      
      setProject(prev => {
        const next = { ...prev };
        if (stage === 'market-analysis') {
          next.marketAnalysis = [...(prev.marketAnalysis || []), { role: 'user', content: prompt }, { role: 'assistant', content: result }];
        } else if (stage === 'brand-story') {
          next.brandStory = [...(prev.brandStory || []), { role: 'user', content: prompt }, { role: 'assistant', content: result }];
        } else if (stage === 'formula-design') {
          next.formulaDesign = [...(prev.formulaDesign || []), { role: 'user', content: prompt }, { role: 'assistant', content: result }];
        } else if (stage === 'visual-identity') {
          next.visualIdentity = [...(prev.visualIdentity || []), { role: 'user', content: prompt }, { role: 'assistant', content: result }];
          if (newImageUrl) next.visualIdentityImage = newImageUrl;
        } else if (stage === 'packaging-design') {
          next.packagingDesign = [...(prev.packagingDesign || []), { role: 'user', content: prompt }, { role: 'assistant', content: result }];
          if (newImageUrl) next.packagingImage = newImageUrl;
        } else {
          if (stage === 'production-file') next.productionSpecs = result;
        }
        return next;
      });
      setRefinementInputs(prev => ({ ...prev, [stage]: '' }));
    } catch (err) {
      setError('优化失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!project.name || !project.targetAudience || !project.salesChannels || !project.salesRegions || !project.painPoints) {
      setError('请填写完整的品牌与市场信息');
      return;
    }
    setError(null);
    setIsLoading(true);
    setLoadingMsg('正在进行深度市场分析与差异化定位...');
    try {
      const prompt = `
        为品牌 "${project.name}" 进行全方位的市场分析。
        
        【输入信息】
        - 目标客群: ${project.targetAudience}
        - 售卖渠道: ${project.salesChannels}
        - 售卖地区: ${project.salesRegions}
        - 产品解决的痛点: ${project.painPoints}
        - 核心价值: ${project.coreValues}
        ${customInputs['market-analysis'] ? `- 额外要求: ${customInputs['market-analysis']}` : ''}
        
        【分析要求】
        1. 竞品调研：分析当前市场上的主要竞争对手及其优劣势。
        2. 市场份额：预估或引用行业数据说明当前市场份额分布。
        3. 竞品品牌矩阵：通过表格或分类展示竞品的品牌定位矩阵。
        4. 竞品价位带：详细列出竞品的价格区间分布。
        5. 深度分析上述维度的行业现状与趋势。
        6. 提供品牌定位的差异化建议（USP）。
        7. 建议最适合的品牌调性与市场切入点。
        
        请务必使用 Markdown 表格展示数据，并在文末提供 chart-data JSON 块用于可视化。
      `;
      const result = await generateBrandStrategy(prompt, "You are a world-class beauty brand consultant and market strategist. Provide deep, actionable market insights and unique brand positioning strategies.");
      setProject(prev => ({ ...prev, marketAnalysis: [{ role: 'assistant', content: result }] }));
    } catch (err) {
      setError('分析失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const runStorytelling = async () => {
    setIsLoading(true);
    setLoadingMsg('正在构建品牌故事...');
    try {
      const lastAnalysis = project.marketAnalysis?.[project.marketAnalysis.length - 1]?.content || '';
      const context = lastAnalysis ? `基于市场分析: ${lastAnalysis}` : `品牌名: ${project.name}, 受众: ${project.targetAudience}`;
      const prompt = `基于以下背景，为品牌 "${project.name}" 撰写品牌故事和slogan。背景: ${context}。${customInputs['brand-story'] ? `额外要求: ${customInputs['brand-story']}` : ''}。要求：情感共鸣强，符合美妆行业调性。`;
      const result = await generateBrandStrategy(prompt, "You are a creative brand storyteller specializing in luxury beauty.");
      setProject(prev => ({ ...prev, brandStory: [{ role: 'assistant', content: result }] }));
    } catch (err) {
      setError('故事生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const runFormulaDesign = async () => {
    setIsLoading(true);
    setLoadingMsg('正在设计专业化妆品配方...');
    try {
      const context = `品牌: ${project.name}, 痛点: ${project.painPoints}, 核心价值: ${project.coreValues}`;
      const prompt = `
        为品牌 "${project.name}" 设计专业化妆品配方。
        
        【背景信息】
        - 品牌背景: ${context}
        - 配方需求描述: ${customInputs['formula-design'] || '根据品牌调性设计一款明星产品配方'}
        
        【设计要求】
        1. 提供详细的成分表（INCI名称）。
        2. 说明核心活性成分及其功效原理。
        3. 描述产品的质地、肤感及使用体验。
        4. 提供生产工艺简述及注意事项。
        5. 确保配方符合现代美妆趋势（如纯净美容、高效修护等）。
      `;
      const result = await generateFormulaDesign(prompt, "You are a senior cosmetic chemist and formulation scientist. Provide professional, safe, and innovative cosmetic formulations.");
      setProject(prev => ({ ...prev, formulaDesign: [{ role: 'assistant', content: result }] }));
    } catch (err) {
      setError('配方设计失败');
    } finally {
      setIsLoading(false);
    }
  };

  const runVisualIdentity = async () => {
    setIsLoading(true);
    setLoadingMsg('正在定义视觉识别系统与美学方案...');
    try {
      const lastStory = project.brandStory?.[project.brandStory.length - 1]?.content || '';
      const context = lastStory ? `基于品牌故事: ${lastStory}` : `品牌名: ${project.name}, 受众: ${project.targetAudience}`;
      
      // Prepare prompts
      const textPrompt = `为品牌 "${project.name}" 设计视觉识别系统(VI)。背景: ${context}。${customInputs['visual-identity'] ? `额外要求: ${customInputs['visual-identity']}` : ''}。请包含：配色方案、字体建议、视觉风格描述。`;
      
      // Image prompt can be derived from the same context to allow parallel execution
      const imagePrompt = `A luxury beauty brand visual identity moodboard for "${project.name}". Target Audience: ${project.targetAudience}. Style: Elegant, high-end, futuristic. Include color swatches, sophisticated typography, and abstract beauty textures. Pink-purple aesthetic. ${customInputs['visual-identity'] || ''}`;

      // Run in parallel
      const [textResult, imageUrl] = await Promise.all([
        generateBrandStrategy(textPrompt, "You are a world-class visual identity designer for luxury brands."),
        generatePackagingDesign(imagePrompt)
      ]);

      setProject(prev => ({ 
        ...prev, 
        visualIdentity: [{ role: 'assistant', content: textResult }],
        visualIdentityImage: imageUrl || undefined
      }));
    } catch (err) {
      setError('视觉设计失败');
    } finally {
      setIsLoading(false);
    }
  };

  const runPackaging = async () => {
    setIsLoading(true);
    setLoadingMsg('正在生成包装设计渲染图...');
    try {
      const lastVI = project.visualIdentity?.[project.visualIdentity.length - 1]?.content || '';
      const context = lastVI ? `视觉风格参考: ${lastVI}` : `品牌名: ${project.name}, 调性: ${project.brandStory?.[0]?.content || '现代高端'}`;
      const prompt = `品牌 "${project.name}" 的高端美妆包装。${context}。${customInputs['packaging-design'] ? `额外要求: ${customInputs['packaging-design']}` : ''}。产品类型：护肤品精华液。`;
      
      // Run in parallel: text description and image generation
      const [textResult, imageUrl] = await Promise.all([
        generateBrandStrategy(`为品牌 "${project.name}" 描述其高端包装设计方案。背景: ${context}。${customInputs['packaging-design'] || ''} (要求：文字说明言简意赅，字数限制在500字以内)`, "You are a luxury packaging designer."),
        generatePackagingDesign(prompt, project.packagingReferenceImage)
      ]);

      if (imageUrl || textResult) {
        setProject(prev => ({ 
          ...prev, 
          packagingImage: imageUrl || prev.packagingImage,
          packagingDesign: [{ role: 'assistant', content: textResult }]
        }));
      }
    } catch (err) {
      setError('包装生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const runProduction = async () => {
    setIsLoading(true);
    setLoadingMsg('正在生成印刷级技术图纸与生产规范...');
    try {
      // Prepare prompts
      const dielinePrompt = `A professional technical packaging dieline blueprint for a beauty product box (serum bottle size). Flat layout, white background, blue and red technical lines for cutting and folding. Include measurements, scale bars, and crop marks. High contrast, clean vector style, suitable for Adobe Illustrator reference. Brand: ${project.name}.`;

      // Run in parallel
      const [textResult, dielineUrl] = await Promise.all([
        generateProductionSpecs(project.name, (project.visualIdentity?.[project.visualIdentity.length - 1]?.content) || '标准高端美妆视觉系统'),
        generatePackagingDesign(dielinePrompt)
      ]);

      setProject(prev => ({ 
        ...prev, 
        productionSpecs: textResult,
        productionDielineImage: dielineUrl || undefined
      }));
    } catch (err) {
      setError('生产文件生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const runVideo = async () => {
    if (!hasKey) {
      setError('视频生成需要选择 API Key');
      return;
    }
    setIsLoading(true);
    try {
      const lastStory = project.brandStory?.[project.brandStory.length - 1]?.content || '优雅高端';
      const lastVI = project.visualIdentity?.[project.visualIdentity.length - 1]?.content || '粉紫渐变科技感';
      const context = `品牌故事: ${lastStory}, 视觉参考: ${lastVI}`;
      const prompt = `品牌 "${project.name}" 的产品推广视频。${context}。${customInputs['marketing-video'] ? `额外要求: ${customInputs['marketing-video']}` : ''}`;
      const videoUrl = await generateMarketingVideo(prompt, (msg) => setLoadingMsg(msg), project.marketingVideoReferenceImage);
      setProject(prev => ({ ...prev, marketingVideoUrl: videoUrl }));
    } catch (err) {
      setError('视频生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'packagingReferenceImage' | 'marketingVideoReferenceImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProject(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderImageUpload = (field: 'packagingReferenceImage' | 'marketingVideoReferenceImage') => (
    <div className="space-y-3">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30">
        参考图 (可选) / Reference Image (Optional)
      </label>
      <div className="flex items-center gap-4">
        {!project[field] ? (
          <label className="flex-1 border-2 border-dashed border-beauty-ink/10 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-beauty-ink/5 transition-all group">
            <Upload className="w-8 h-8 text-beauty-ink/20 group-hover:text-beauty-pink/40 transition-colors mb-2" />
            <span className="text-xs font-bold text-beauty-ink/40">点击或拖拽上传参考图</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field)} />
          </label>
        ) : (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-beauty-ink/10">
            <img src={project[field]} alt="Reference" className="w-full h-full object-cover" />
            <button 
              onClick={() => setProject(prev => ({ ...prev, [field]: undefined }))}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const HistoryControls = ({ stage }: { stage: BrandStage }) => {
    const stageHistory = project.history[stage] || [];
    if (stageHistory.length === 0) return (
      <button 
        onClick={() => startNewSession(stage)}
        className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-beauty-ink/40 transition-all border border-white/40"
      >
        <Plus className="w-3.5 h-3.5" /> 新建会话 / New Session
      </button>
    );

    return (
      <div className="flex items-center gap-4">
        <button 
          onClick={() => startNewSession(stage)}
          className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-beauty-ink/40 transition-all border border-white/40"
        >
          <Plus className="w-3.5 h-3.5" /> 新建 / New
        </button>
        
        <div className="h-4 w-[1px] bg-beauty-ink/10" />
        
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-widest text-beauty-ink/20 whitespace-nowrap">历史记录 / History:</span>
          {stageHistory.map((_, idx) => (
            <button
              key={idx}
              onClick={() => switchVersion(stage, idx)}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                project.currentVersion[stage] === idx 
                  ? "bg-beauty-pink text-white shadow-lg shadow-beauty-pink/20" 
                  : "bg-white/40 text-beauty-ink/40 hover:bg-white/60"
              )}
            >
              V{idx + 1}
            </button>
          ))}
          {/* Option to go back to "current" if we are in a new one */}
          {project.currentVersion[stage] === undefined && (
            <div className="px-3 py-1 rounded-lg text-[10px] font-bold bg-beauty-pink/10 text-beauty-pink border border-beauty-pink/20">
              当前 / Current
            </div>
          )}
        </div>
      </div>
    );
  };

  const MarketAnalysisResult = ({ messages }: { messages: ChatMessage[] }) => {
    const COLORS = ['#FF69B4', '#9370DB', '#00FA9A', '#FFD700', '#FF4500', '#1E90FF'];

    return (
      <div className="space-y-8">
        {messages.map((msg, idx) => {
          const chartMatch = msg.content.match(/```chart-data\n([\s\S]*?)\n```/);
          const textContent = msg.content.replace(/```chart-data\n([\s\S]*?)\n```/, '');
          
          let chartData = null;
          if (chartMatch) {
            try {
              chartData = JSON.parse(chartMatch[1]);
            } catch (e) {
              console.error("Failed to parse chart data", e);
            }
          }

          return (
            <div key={idx} className={cn(
              "flex flex-col gap-4",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "max-w-[85%] p-6 rounded-[2rem]",
                msg.role === 'user' 
                  ? "bg-beauty-pink/10 border border-beauty-pink/20 text-beauty-ink" 
                  : "glass markdown-body"
              )}>
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium">{msg.content}</p>
                ) : (
                  <Markdown>{textContent}</Markdown>
                )}
              </div>

              {chartData && (
                <div className="glass p-10 rounded-[2rem] space-y-6 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-beauty-pink animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-beauty-ink/60">{chartData.title || '市场数据可视化'}</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartData.type === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={chartData.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.data.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      ) : chartData.type === 'line' ? (
                        <LineChart data={chartData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#FF69B4" strokeWidth={3} dot={{ r: 6, fill: '#FF69B4' }} />
                        </LineChart>
                      ) : (
                        <BarChart data={chartData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip cursor={{ fill: 'rgba(255, 105, 180, 0.05)' }} />
                          <Bar dataKey="value" fill="#FF69B4" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const ChatHistory = ({ messages }: { messages: ChatMessage[] }) => (
    <div className="space-y-6">
      {messages.map((msg, idx) => (
        <div key={idx} className={cn(
          "flex flex-col gap-2",
          msg.role === 'user' ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "max-w-[85%] p-6 rounded-[2rem]",
            msg.role === 'user' 
              ? "bg-beauty-pink/10 border border-beauty-pink/20 text-beauty-ink" 
              : "glass markdown-body"
          )}>
            {msg.role === 'user' ? (
              <p className="text-sm font-medium">{msg.content}</p>
            ) : (
              <Markdown>{msg.content}</Markdown>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderRefinementInput = (stage: BrandStage | 'production-file') => (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className="w-1.5 h-1.5 rounded-full bg-beauty-pink animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-beauty-ink/40">追问与补充 / Follow-up & Supplement</span>
      </div>
      <div className="flex gap-3 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-sm focus-within:ring-4 focus-within:ring-beauty-pink/5 transition-all">
        <input 
          type="text"
          placeholder="对结果不满意？您可以继续追问，例如：'再补充一些关于环保的细节' 或 '针对Z世代再深入分析一下'..."
          className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-sm placeholder:text-beauty-ink/30"
          value={refinementInputs[stage] || ''}
          onChange={e => setRefinementInputs(prev => ({ ...prev, [stage]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleRefine(stage)}
        />
        <button 
          onClick={() => handleRefine(stage)}
          disabled={isLoading || !refinementInputs[stage]}
          className="px-6 beauty-gradient text-white rounded-xl shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 font-bold text-xs"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          发送
        </button>
      </div>
    </div>
  );

  const renderStageInput = (stage: BrandStage, label: string, runFn: () => void, imageField?: 'packagingReferenceImage' | 'marketingVideoReferenceImage') => (
    <div className="glass p-8 rounded-[2rem] space-y-6">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30 mb-3">{label}</label>
        <textarea 
          placeholder="输入您的具体需求或留空使用默认设置..."
          className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 h-24 focus:outline-none focus:ring-4 focus:ring-beauty-pink/5 transition-all resize-none text-sm"
          value={customInputs[stage] || ''}
          onChange={e => setCustomInputs(prev => ({ ...prev, [stage]: e.target.value }))}
        />
      </div>

      {imageField && renderImageUpload(imageField)}

      <button 
        onClick={runFn}
        disabled={isLoading}
        className="w-full py-4 beauty-gradient text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        生成方案
      </button>
    </div>
  );

  const renderNextStepButton = (nextStage: BrandStage, label: string) => (
    <div className="mt-12 pt-8 border-t border-beauty-ink/5 flex items-center justify-between">
      <HistoryControls stage={currentStage} />
      <button 
        onClick={() => setCurrentStage(nextStage)}
        className="flex items-center gap-3 text-beauty-pink font-black text-lg group hover:opacity-80 transition-all"
      >
        {label} <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/10 flex flex-col bg-white/10 backdrop-blur-2xl">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 beauty-gradient rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight beauty-text-gradient">AuraBeauty AI</h1>
          </div>
          <p className="text-[10px] text-beauty-ink/40 uppercase tracking-[0.2em] font-bold">Beauty Tech Solution</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setCurrentStage(stage.id)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                currentStage === stage.id 
                  ? "text-white shadow-xl" 
                  : "hover:bg-white/40 text-beauty-ink/60"
              )}
            >
              {currentStage === stage.id && (
                <motion.div 
                  layoutId="active-stage"
                  className="absolute inset-0 beauty-gradient -z-10"
                />
              )}
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                currentStage === stage.id ? "bg-white/20" : "bg-beauty-ink/5 group-hover:bg-beauty-ink/10"
              )}>
                {stage.icon}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{stage.label}</p>
                <p className={cn(
                  "text-[10px] leading-tight mt-0.5 font-medium",
                  currentStage === stage.id ? "text-white/70" : "text-beauty-ink/40"
                )}>
                  {stage.description}
                </p>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          {!hasKey && (
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-3 px-4 bg-beauty-pink/10 text-beauty-pink rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-beauty-pink/20 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Configure API Key
            </button>
          )}
          {hasKey && (
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-wider px-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              AI Engine Ready
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto py-20 px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="mb-16">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-[1px] w-12 beauty-gradient" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black beauty-text-gradient">
                    Phase {STAGES.findIndex(s => s.id === currentStage) + 1}
                  </span>
                </div>
                <h2 className="text-6xl font-serif font-bold mb-6 tracking-tight">
                  {STAGES.find(s => s.id === currentStage)?.label}
                </h2>
                <p className="text-beauty-ink/50 text-xl max-w-2xl leading-relaxed font-light">
                  {STAGES.find(s => s.id === currentStage)?.description}。您可以直接输入需求生成，或基于前序步骤自动生成。
                </p>
              </div>

              {/* Stage Content */}
              <div className="space-y-10">
                {currentStage === 'market-analysis' && (
                  <div className="space-y-8">
                    {!project.marketAnalysis && (
                      <div className="glass p-10 rounded-[2rem] space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30 mb-3">品牌名称 / Brand Name</label>
                              <input 
                                type="text" 
                                placeholder="例如: Aura Glow"
                                className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-beauty-pink/5 transition-all text-lg"
                                value={project.name}
                                onChange={e => setProject(p => ({ ...p, name: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30 mb-3">目标受众 / Target Audience</label>
                              <input 
                                type="text" 
                                placeholder="例如: 25-35岁追求极简护肤的都市女性"
                                className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-beauty-pink/5 transition-all text-lg"
                                value={project.targetAudience}
                                onChange={e => setProject(p => ({ ...p, targetAudience: e.target.value }))}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30 mb-3">售卖渠道 / Sales Channels</label>
                              <input 
                                type="text" 
                                placeholder="例如: 抖音、小红书、线下专柜"
                                className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-beauty-pink/5 transition-all text-lg"
                                value={project.salesChannels}
                                onChange={e => setProject(p => ({ ...p, salesChannels: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30 mb-3">售卖地区 / Sales Regions</label>
                              <input 
                                type="text" 
                                placeholder="例如: 中国大陆、东南亚、北美"
                                className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-beauty-pink/5 transition-all text-lg"
                                value={project.salesRegions}
                                onChange={e => setProject(p => ({ ...p, salesRegions: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30 mb-3">解决的痛点 / Pain Points Solved</label>
                            <textarea 
                              placeholder="例如: 解决敏感肌用户在换季时的泛红脱皮问题，提供长效修护"
                              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-beauty-pink/5 transition-all text-lg min-h-[100px]"
                              value={project.painPoints}
                              onChange={e => setProject(p => ({ ...p, painPoints: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-beauty-ink/30 mb-3">核心价值 / Core Values</label>
                            <input 
                              type="text" 
                              placeholder="例如: 纯净、科技、可持续"
                              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-beauty-pink/5 transition-all text-lg"
                              value={project.coreValues}
                              onChange={e => setProject(p => ({ ...p, coreValues: e.target.value }))}
                            />
                          </div>
                        </div>
                        <button 
                          onClick={runAnalysis}
                          disabled={isLoading}
                          className="w-full py-5 beauty-gradient text-white rounded-2xl font-black text-lg shadow-2xl shadow-beauty-pink/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                          启动全链路品牌孵化
                        </button>
                      </div>
                    )}
                    {project.marketAnalysis && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <HistoryControls stage="market-analysis" />
                        </div>
                        <MarketAnalysisResult messages={project.marketAnalysis} />
                        {renderRefinementInput('market-analysis')}
                        {renderNextStepButton('brand-story', '下一步：构建品牌故事')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'brand-story' && (
                  <div className="space-y-8">
                    {!project.brandStory ? renderStageInput('brand-story', '品牌故事需求', runStorytelling) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <HistoryControls stage="brand-story" />
                        </div>
                        <ChatHistory messages={project.brandStory} />
                        {renderRefinementInput('brand-story')}
                        {renderNextStepButton('formula-design', '下一步：配方设计')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'formula-design' && (
                  <div className="space-y-8">
                    {!project.formulaDesign ? renderStageInput('formula-design', '配方场景与需求描述', runFormulaDesign) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <HistoryControls stage="formula-design" />
                        </div>
                        <ChatHistory messages={project.formulaDesign} />
                        {renderRefinementInput('formula-design')}
                        {renderNextStepButton('visual-identity', '下一步：定义视觉识别')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'visual-identity' && (
                  <div className="space-y-8">
                    {!project.visualIdentity ? renderStageInput('visual-identity', '视觉设计需求', runVisualIdentity) : (
                      <div className="space-y-10">
                        <div className="flex justify-between items-center mb-4">
                          <HistoryControls stage="visual-identity" />
                        </div>
                        {project.visualIdentityImage && (
                          <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl">
                            <img 
                              src={project.visualIdentityImage} 
                              alt="Visual Identity Moodboard" 
                              className="w-full transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute top-6 left-6 px-4 py-2 glass rounded-full text-[10px] font-black uppercase tracking-widest text-beauty-pink">
                              视觉概念图 / Visual Concept
                            </div>
                          </div>
                        )}
                        <ChatHistory messages={project.visualIdentity} />
                        {renderRefinementInput('visual-identity')}
                        {renderNextStepButton('packaging-design', '下一步：包装设计渲染')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'packaging-design' && (
                  <div className="space-y-8">
                    {!project.packagingDesign ? renderStageInput('packaging-design', '包装设计需求', runPackaging, 'packagingReferenceImage') : (
                      <div className="space-y-10">
                        <div className="flex justify-between items-center mb-4">
                          <HistoryControls stage="packaging-design" />
                        </div>
                        <ChatHistory messages={project.packagingDesign} />
                        
                        {project.packagingImage && (
                          <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl">
                            <img 
                              src={project.packagingImage} 
                              alt="Packaging Design" 
                              className="w-full transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={runPackaging}
                                className="px-8 py-3 bg-white text-beauty-ink rounded-full font-black text-sm shadow-xl"
                              >
                                重新生成渲染图
                              </button>
                            </div>
                          </div>
                        )}

                        {renderRefinementInput('packaging-design')}
                        
                        {/* Production Specs Section within Packaging */}
                        <div className="space-y-6">
                          {!project.productionSpecs ? (
                            <div className="glass p-8 rounded-[2rem] flex flex-col items-center text-center">
                              <Printer className="w-12 h-12 text-beauty-pink/40 mb-4" />
                              <h3 className="text-xl font-serif font-bold mb-2">对设计方案满意？</h3>
                              <p className="text-beauty-ink/40 text-sm mb-6">一键生成可直接交付工厂的印刷生产技术规范文件</p>
                              <button 
                                onClick={runProduction}
                                disabled={isLoading}
                                className="px-10 py-4 beauty-gradient text-white rounded-xl font-black shadow-lg flex items-center gap-2"
                              >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                                生成落地生产文件
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-beauty-pink/20" />
                                <span className="text-[10px] uppercase tracking-widest font-black text-beauty-pink">落地生产规范与技术图纸 / Production Specs & Dieline</span>
                                <div className="h-[1px] flex-1 bg-beauty-pink/20" />
                              </div>

                              {project.productionDielineImage && (
                                <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl bg-white p-8 border border-beauty-ink/5">
                                  <img 
                                    src={project.productionDielineImage} 
                                    alt="Technical Dieline" 
                                    className="w-full h-auto object-contain"
                                  />
                                  <div className="absolute top-6 left-6 px-4 py-2 glass rounded-full text-[10px] font-black uppercase tracking-widest text-beauty-pink">
                                    技术刀版图 / Technical Dieline
                                  </div>
                                  <div className="absolute bottom-6 right-6">
                                    <a 
                                      href={project.productionDielineImage} 
                                      download={`${project.name}_Dieline.png`}
                                      className="p-3 bg-beauty-ink/5 hover:bg-beauty-ink/10 rounded-xl transition-colors flex items-center gap-2 text-beauty-ink text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      <Download className="w-4 h-4" /> 下载图纸
                                    </a>
                                  </div>
                                </div>
                              )}

                              <div className="glass p-10 rounded-[2rem] markdown-body relative">
                                <div className="absolute top-8 right-8 flex gap-3">
                                  <button 
                                    onClick={() => {
                                      const blob = new Blob([project.productionSpecs || ''], { type: 'text/plain' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `${project.name}_Production_Specs_Adobe_Guide.txt`;
                                      a.click();
                                    }}
                                    className="p-3 bg-beauty-pink/10 hover:bg-beauty-pink/20 rounded-xl transition-colors flex items-center gap-2 text-beauty-pink text-xs font-bold"
                                  >
                                    <Download className="w-4 h-4" /> 下载 Adobe 规范
                                  </button>
                                </div>
                                <Markdown>{project.productionSpecs}</Markdown>
                              </div>
                              {renderRefinementInput('production-file')}
                            </div>
                          )}
                        </div>

                        {renderNextStepButton('marketing-video', '下一步：生成营销视频')}
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'marketing-video' && (
                  <div className="space-y-8">
                    {!project.marketingVideoUrl ? renderStageInput('marketing-video', '视频脚本需求', runVideo, 'marketingVideoReferenceImage') : (
                      <div className="space-y-10">
                        <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-black">
                          <video 
                            src={project.marketingVideoUrl} 
                            controls 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-6">
                          <button 
                            onClick={runVideo}
                            className="px-10 py-4 beauty-gradient text-white rounded-2xl font-black shadow-xl"
                          >
                            重新生成视频
                          </button>
                          <a 
                            href={project.marketingVideoUrl} 
                            download="marketing-video.mp4"
                            className="px-10 py-4 glass text-beauty-ink rounded-2xl font-black flex items-center gap-2"
                          >
                            <Download className="w-5 h-5" /> 下载视频
                          </a>
                        </div>
                        {renderStageInput('marketing-video', '修改视频需求', runVideo, 'marketingVideoReferenceImage')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/40 backdrop-blur-xl z-50 flex flex-col items-center justify-center"
            >
              <div className="relative">
                <div className="w-32 h-32 border-4 border-beauty-pink/10 border-t-beauty-pink rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-beauty-pink animate-pulse" />
              </div>
              <p className="mt-10 text-beauty-ink font-serif italic text-2xl beauty-text-gradient">{loadingMsg}</p>
              <p className="mt-3 text-beauty-ink/30 text-xs font-black tracking-[0.4em] uppercase">AuraBeauty AI Engine</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-12 right-12 bg-red-500 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 z-50"
            >
              <AlertCircle className="w-6 h-6" />
              <span className="font-bold">{error}</span>
              <button onClick={() => setError(null)} className="ml-6 text-white/60 hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
