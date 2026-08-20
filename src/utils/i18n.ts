export const translations = {
  zh: {
    // App & Navbar
    appTitle: '随手查 · 图文知识卡片',
    appSubtitle: '极速生成深度图文卡片与结构图',
    navCreate: '生成卡片',
    navExplore: '精选卡片',
    navAdmin: '管理员',
    navLogout: '退出',
    navLogoutTitle: '退出登录',
    navSignIn: '管理员登录',

    // Guest Mode & Prompts
    guestBannerTitle: '当前处于访客模式',
    guestBannerDesc: '仅可浏览管理员公开的精选知识卡片。登录管理员后可自由生成卡片与深度追问。',
    guestPromptTitle: '登录管理员以开启 AI 随手查与图文生成',
    guestPromptDesc: '支持 Gemini 3.7 Flash 思考推理、Tavily 全网检索、Mermaid 结构图与拍照识图',
    guestReadOnlyNotice: '访客仅可浏览卡片与导出',
    dismiss: '关闭',

    // Search Prompt Bar
    searchPlaceholder: '输入想要查询的概念、人物、热点、原理，或拍照识图...',
    generateBtn: '一键生成卡片',
    generating: '正在提炼生成中...',
    audienceLabel: '解释档位',
    audienceStudent: '讲给小孩 🧸',
    audienceStudentDesc: '童趣故事、生动比喻、零门槛大白话',
    audienceGeneral: '说点人话 ☕',
    audienceGeneralDesc: '不装不绕、深入浅出、直击核心本质',
    audienceExpert: '导师开课 🎓',
    audienceExpertDesc: '学术推导、底层架构、硬核深度拆解',
    imageModeLabel: '配图偏好',
    imageModeNo: '不要图 📄',
    imageModeYes: '要配图 🎨 (1~2张)',
    photoUpload: '拍照/传图',
    photoUploaded: '已添加图片',
    photoTip: '将作为卡片首图并触发多模态视觉识别',
    photoQueryFallback: '分析这张照片的知识与核心背景',
    inspirationTitle: '💡 灵感热词',

    // Pipeline Steps
    pipelineTitle: '生成流水线',
    stepIntent: '意图分流与搜索决策',
    stepSearch: 'Tavily 事实与网图检索',
    stepReasoning: '概念推理与知识提炼',
    stepImageGen: 'Gemini 3.1 概念插图生成',
    stepSynthesis: '卡片组织与结构图输出',
    stepComplete: '卡片生成完成',

    // Card Actions & Views
    exportCard: '生成海报',
    exportSuccess: '海报已保存！',
    copyMarkdown: '复制 Markdown',
    copied: '已复制到剪贴板',
    askFollowUp: '针对此卡片追问',
    publicToGuests: '公开给访客',
    privateToAdmin: '仅管理员私密',
    publicToggleTitleToPrivate: '点击设为私密 (仅管理员可见)',
    publicToggleTitleToPublic: '点击设为公开 (允许访客浏览)',
    favorited: '已收藏',
    favorite: '收藏',
    delete: '删除',
    cancel: '取消',
    deleteConfirm: '确定要删除此知识卡片吗？',
    diagramTitle: '结构图 / 关系图',
    viewSource: '查看配图来源',
    sourceWeb: '网络实图',
    sourceGen: 'Gemini 3.1 生图',
    sourceUpload: '用户上传',

    // Terminology Click & Popover
    termPopupTitle: '💡 专业术语释义与追问',
    termExplanationPrompt: '这个是什么意思？',
    termAskInChat: '在对话中深度解析并归档',
    termQueryPrefix: '请详细解释术语「',
    termQuerySuffix: '」，它在当前知识卡片中是什么意思？请深入浅出地讲解。',
    termCopy: '复制术语',
    termCopied: '已复制',

    // In-Card Follow-up Q&A
    followUpTitle: '卡片专属追问',
    followUpPlaceholder: '对本卡片内容有疑问？在此快速追问...',
    followUpContextLabel: '💡 知识上下文：',
    followUpEmptyHint: '针对该卡片的核心概念、公式、流程或延伸问题进行深度追问...',
    followUpThinking: '正在思考解答...',
    followUpError: '⚠️ 追问失败，请检查网络或 API 配置。',
    sendBtn: '发送',

    // Archive Library
    archiveTitle: '卡片记忆库',
    allCards: '全部卡片',
    all: '全部',
    favoritesOnly: '仅收藏',
    searchArchivePlaceholder: '搜索卡片标题、标签或内容...',
    noCardsFound: '暂无卡片，快去输入问题生成第一张知识卡片吧！',

    // Settings Modal
    settingsTitle: '系统与 API 设置',
    openRouterKeyLabel: 'OpenRouter API Key',
    openRouterKeyDesc: '用于驱动 Gemini 3.7 Flash 思考与 Gemini 3.1 Flash Lite 生图',
    tavilyKeyLabel: 'Tavily Search API Key',
    tavilyKeyDesc: '用于获取实时网络事实清洗与真实图文',
    modelLabel: '主推理模型',
    imageModelLabel: '生图模型',
    saveSettings: '保存配置',
    verifyApi: '测试连接',

    // Login Modal
    loginModalTitle: '管理员身份登录',
    loginModalDesc: '登录后解锁卡片生成、追问与权限管理',
    loginUsername: '管理员账号',
    loginPassword: '登录密码',
    loginDefaultHint: '默认密码: admin123 (可在 .env 或系统设置中修改)',
    loginTtlLabel: '保持登录时长 (Cookie TTL)',
    loginTtl7d: '7天',
    loginTtl30d: '30天 (推荐)',
    loginTtl90d: '90天',
    loginTtl365d: '1年',
    loginSubmit: '立即登录',
    loginFailed: '登录失败，请检查账号密码',

    // Poster Export Modal
    exportPosterHeader: '导出高清知识海报',
    downloadPosterBtn: '下载高清 PNG 海报',

    // Mermaid Viewer Controls
    zoomIn: '放大',
    zoomOut: '缩小',
    resetZoom: '重置',
    expand: '全屏放大',
    minimize: '退出全屏',
    diagramDefaultTitle: '逻辑结构 / 流程图 (Mermaid SVG)',
  },
  en: {
    // App & Navbar
    appTitle: 'SnapCard · Knowledge Cards',
    appSubtitle: 'Instant visual knowledge cards & diagrams powered by Gemini & Tavily',
    navCreate: 'Create Card',
    navExplore: 'Explore',
    navAdmin: 'Admin',
    navLogout: 'Log out',
    navLogoutTitle: 'Log out',
    navSignIn: 'Admin Sign In',

    // Guest Mode & Prompts
    guestBannerTitle: 'Guest Browsing Mode',
    guestBannerDesc: 'You can view public knowledge cards. Sign in to generate cards and ask follow-up questions.',
    guestPromptTitle: 'Sign In as Admin to Generate Knowledge Cards & Diagrams',
    guestPromptDesc: 'Supports Gemini 3.7 Flash reasoning, Tavily web search, Mermaid diagrams & photo recognition',
    guestReadOnlyNotice: 'Guest read-only mode',
    dismiss: 'Dismiss',

    // Search Prompt Bar
    searchPlaceholder: 'Ask any concept, entity, science principle, or snap a photo...',
    generateBtn: 'Generate Card',
    generating: 'Generating Card...',
    audienceLabel: 'Tone & Style',
    audienceStudent: 'Explain to a Child 🧸',
    audienceStudentDesc: 'Playful stories, fun analogies, zero jargon',
    audienceGeneral: 'In Plain Words ☕',
    audienceGeneralDesc: 'No jargon, pure essence, intuitive & clear',
    audienceExpert: 'Masterclass 🎓',
    audienceExpertDesc: 'Rigorous mechanics, system architecture, deep dive',
    imageModeLabel: 'Illustration',
    imageModeNo: 'No Image 📄',
    imageModeYes: 'Need Image 🎨 (1-2 imgs)',
    photoUpload: 'Upload / Photo',
    photoUploaded: 'Photo Added',
    photoTip: 'Will be used as primary image with multimodal vision analysis',
    photoQueryFallback: 'Analyze knowledge and core concepts from this photo',
    inspirationTitle: '💡 Quick Inspiration',

    // Pipeline Steps
    pipelineTitle: 'Pipeline Stage',
    stepIntent: 'Intent Routing & Strategy',
    stepSearch: 'Tavily Facts & Web Images',
    stepReasoning: 'Concept Synthesis',
    stepImageGen: 'Gemini 3.1 Concept Illustration',
    stepSynthesis: 'Audience & Diagram Layout',
    stepComplete: 'Card Ready',

    // Card Actions & Views
    exportCard: 'Export Poster',
    exportSuccess: 'Poster downloaded!',
    copyMarkdown: 'Copy Markdown',
    copied: 'Copied to clipboard',
    askFollowUp: 'Follow-up Q&A',
    publicToGuests: 'Public to Guests',
    privateToAdmin: 'Private (Admin only)',
    publicToggleTitleToPrivate: 'Click to make private (admin only)',
    publicToggleTitleToPublic: 'Click to make public (guests can view)',
    favorited: 'Favorited',
    favorite: 'Favorite',
    delete: 'Delete',
    cancel: 'Cancel',
    deleteConfirm: 'Are you sure you want to delete this card?',
    diagramTitle: 'Diagram / Structure Map',
    viewSource: 'View Image Source',
    sourceWeb: 'Web Image',
    sourceGen: 'Gemini 3.1 Image',
    sourceUpload: 'User Upload',

    // Terminology Click & Popover
    termPopupTitle: '💡 Term Explanation & Q&A',
    termExplanationPrompt: 'What does this mean?',
    termAskInChat: 'Ask in Q&A & Archive under card',
    termQueryPrefix: 'Please explain the term: "',
    termQuerySuffix: '", what does it mean in the context of this card? Please provide a clear explanation.',
    termCopy: 'Copy Term',
    termCopied: 'Copied',

    // In-Card Follow-up Q&A
    followUpTitle: 'In-Card Follow-up',
    followUpPlaceholder: 'Ask specific questions about this card...',
    followUpContextLabel: '💡 Knowledge Context:',
    followUpEmptyHint: 'Ask specific follow-up questions about this card\'s concepts, formulas, or steps...',
    followUpThinking: 'Thinking and analyzing...',
    followUpError: '⚠️ Follow-up failed. Please check network or API settings.',
    sendBtn: 'Send',

    // Archive Library
    archiveTitle: 'Card Archive',
    allCards: 'All Cards',
    all: 'All',
    favoritesOnly: 'Favorites',
    searchArchivePlaceholder: 'Search titles, tags, or content...',
    noCardsFound: 'No cards yet. Try typing a query above to generate your first card!',

    // Settings Modal
    settingsTitle: 'Settings & API Keys',
    openRouterKeyLabel: 'OpenRouter API Key',
    openRouterKeyDesc: 'Powers Gemini 3.7 Flash reasoning & Gemini 3.1 Flash Lite images',
    tavilyKeyLabel: 'Tavily Search API Key',
    tavilyKeyDesc: 'Provides clean real-time facts & web images',
    modelLabel: 'Reasoning Model',
    imageModelLabel: 'Image Generation Model',
    saveSettings: 'Save Settings',
    verifyApi: 'Test API Connection',

    // Login Modal
    loginModalTitle: 'Admin Sign In',
    loginModalDesc: 'Unlock full card generation, follow-up Q&A & controls',
    loginUsername: 'Username',
    loginPassword: 'Password',
    loginDefaultHint: 'Default password: admin123 (configurable in .env or settings)',
    loginTtlLabel: 'Session Duration (TTL)',
    loginTtl7d: '7 days',
    loginTtl30d: '30 days (Recommended)',
    loginTtl90d: '90 days',
    loginTtl365d: '1 year',
    loginSubmit: 'Sign In',
    loginFailed: 'Login failed. Please check your credentials.',

    // Poster Export Modal
    exportPosterHeader: 'Export High-Res Knowledge Poster',
    downloadPosterBtn: 'Download High-Res PNG',

    // Mermaid Viewer Controls
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    expand: 'Fullscreen',
    minimize: 'Exit Fullscreen',
    diagramDefaultTitle: 'Diagram / Structure Map (Mermaid SVG)',
  },
};

export type Language = 'zh' | 'en';

export function getTranslation(lang: Language) {
  return translations[lang] || translations.zh;
}
