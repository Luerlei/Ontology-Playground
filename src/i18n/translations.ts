export type Lang = 'zh' | 'en';

export const translations = {
  zh: {
    // Header
    'header.title': 'Ontology Playground',
    'header.preview': '（预览）',
    'header.points': '积分',
    'header.badges': '徽章',
    'header.share': '分享',
    'header.share.copied': '已复制！',
    'header.share.downloaded': '已下载 RDF',
    'header.share.encoding': '编码中…',
    'header.share.tooltip.catalogue': '复制此本体的可分享链接',
    'header.share.tooltip.custom': '通过链接分享此本体',
    'header.summary': '摘要',
    'header.summary.tooltip': '查看本体摘要',
    'header.aibuilder': 'AI 构建器',
    'header.catalogue': '目录',
    'header.designer': '设计器',
    'header.school': 'Ontology School',
    'header.importexport': '导入 / 导出',
    'header.help': '帮助',
    'header.about': '关于',
    'header.datasources': '数据源',
    'header.lightmode': '浅色模式',
    'header.darkmode': '深色模式',
    'header.language': 'English',
    'header.menu': '菜单',

    // QuestPanel
    'quest.title': '任务',
    'quest.abandon': '放弃',
    'quest.earned_badges': '已获得徽章',
    'quest.total_points': '合计：{points} 积分',

    // SearchFilter
    'search.title': '搜索 & 筛选',
    'search.placeholder': '搜索实体、属性…',
    'search.entities': '实体 ({count})',
    'search.relationships': '关系 ({count})',
    'search.no_results': '无结果："{query}"',

    // InspectorPanel
    'inspector.title': '检查器',
    'inspector.empty.title': '选择一个元素',
    'inspector.empty.text': '点击图中的实体类型或关系，以检查其属性、数据绑定和连接。',
    'inspector.relationship': '关系',
    'inspector.entity_type': '实体类型',
    'inspector.properties': '属性 ({count})',
    'inspector.relationships': '关系 ({count})',
    'inspector.cardinality': '基数',
    'inspector.rel_attributes': '关系属性',
    'inspector.data_bindings': '数据绑定',

    // QueryPlayground
    'query.title': '自然语言查询 (NL2Ontology)',
    'query.placeholder': '询问关于 {name} 的问题…',
    'query.try_asking': '试试：',
    'query.clear': '清除',
    'query.run': '运行查询',

    // OntologyStatsPanel
    'stats.title': '本体洞察',
    'stats.entities': '实体',
    'stats.relationships': '关系',
    'stats.properties': '属性',

    // WelcomeModal
    'welcome.title': '欢迎使用 Ontology Playground（预览）',
    'welcome.subtitle': '通过 Cosmic Coffee Company 探索 Microsoft Fabric IQ Ontology',
    'welcome.feature.entities.title': '实体类型',
    'welcome.feature.entities.text': '发现可复用的逻辑模型，如 Customer、Product 和 Order',
    'welcome.feature.relationships.title': '关系',
    'welcome.feature.relationships.text': '查看实体如何通过有向类型链接相互连接',
    'welcome.feature.bindings.title': '数据绑定',
    'welcome.feature.bindings.text': '将本体概念连接到 OneLake 中的真实数据源',
    'welcome.feature.queries.title': 'NL 查询',
    'welcome.feature.queries.text': '用自然语言提问并遍历图',
    'welcome.start': '开始探索',
    'welcome.footer': '完成任务以获取徽章并了解 Microsoft Fabric IQ Ontology',

    // HelpModal
    'help.title': '如何使用 Ontology Playground（预览）',
    'help.graph.title': '探索图',
    'help.graph.text': '点击任意<strong>实体类型</strong>（彩色节点）可查看其属性、关系和数据绑定。点击<strong>关系线</strong>可查看实体的连接方式。使用左下角的控件缩放和重置布局。',
    'help.quests.title': '完成任务',
    'help.quests.text': '从左侧面板选择一个任务，开始引导之旅。按照指示点击特定实体或关系。完成所有步骤即可获得<strong>徽章</strong>和<strong>积分</strong>！',
    'help.nl.title': '提问自然语言问题',
    'help.nl.text': '使用右下角的查询区域提问，例如"显示所有金牌客户"或"哪些产品来自埃塞俄比亚？"。图将高亮显示相关实体和关系。',
    'help.bindings.title': '查看数据绑定',
    'help.bindings.text': '选择实体类型后，检查器将显示本体属性如何映射到 OneLake 中的真实数据源，包括 Lakehouse 表和 Power BI 语义模型。',
    'help.about_iq.title': '关于 Microsoft Fabric IQ Ontology',
    'help.about_iq.text': '本体是业务的共享、机器可理解词汇表。它定义了实体类型（如 Customer、Product）、其属性和关系。此演示使用虚构的"Cosmic Coffee Company"来说明这些概念。',
    'help.shortcuts.title': '键盘快捷键',
    'help.shortcut.palette': '打开命令面板',
    'help.shortcut.help': '打开此帮助对话框',
    'help.shortcut.close': '关闭任意对话框',
    'help.shortcut.navigate': '导航面板结果',
    'help.shortcut.select': '选择面板命令',
    'help.got_it': '知道了！',

    // AboutModal
    'about.title': '关于 Ontology Playground',
    'about.desc1': 'Ontology Playground 是一个社区学习和设计平台，用于构建 RDF/OWL 本体、探索图关系，以及准备与 Microsoft Fabric IQ 工作流兼容的模型。',
    'about.learn_more': '了解更多关于 Microsoft Fabric IQ：',
    'about.trademark.title': '商标声明',
    'about.trademark.text': '本项目可能包含项目、产品或服务的商标或徽标。使用 Microsoft 商标或徽标须遵守 Microsoft 商标与品牌准则。在本项目修改版本中使用 Microsoft 商标或徽标不得引起混淆或暗示 Microsoft 的赞助。使用任何第三方商标或徽标须遵守相应第三方的政策。',
    'about.close': '关闭',

    // GalleryModal
    'gallery.title': 'Ontology 目录',
    'gallery.subtitle': '浏览并加载目录中的本体',

    // OntologySummaryModal
    'summary.title': '本体摘要',
    'summary.copy': '复制',
    'summary.copied': '已复制！',
    'summary.entities': '实体',
    'summary.relationships': '关系',

    // DataSourcesModal
    'datasources.title': '数据源',
    'datasources.subtitle': 'Cosmic Coffee 本体如何绑定到 OneLake',
    'datasources.onelake': 'Microsoft OneLake',
    'datasources.onelake_desc': 'Microsoft Fabric 的统一数据湖。本体将实体类型绑定到此处存储的表和语义模型。',

    // ImportExportModal
    'import.title': '导入 / 导出',
    'import.subtitle': '加载自己的本体或导出当前本体',
    'import.import_btn': '导入本体',
    'import.export_btn': '导出本体',
    'import.reset_btn': '重置为默认',
    'import.choose_file': '选择文件',
    'import.success': '导入成功！',
    'import.error': '导入失败',
    'import.format_json': 'JSON',
    'import.format_rdf': 'RDF/OWL',

    // PathFinderPanel
    'pathfinder.title': '最短路径查找',
    'pathfinder.from': '从',
    'pathfinder.to': '到',
    'pathfinder.find': '查找',
    'pathfinder.clear': '清除',
    'pathfinder.path_found': '找到路径',
    'pathfinder.no_path': '无连接路径',

    // LearnPage
    'learn.title': 'Ontology School',
    'learn.back_playground': 'Playground',
    'learn.all_courses': '所有课程',
    'learn.loading': '加载中…',
    'learn.error': '加载学习内容失败',

    // CommandPalette
    'command.palette.placeholder': '输入命令…',
    'command.palette.no_results': '没有匹配的命令',

    // FabricExportModal
    'fabric.title': '推送到 Microsoft Fabric',
    'fabric.subtitle': '在 Fabric 工作区中创建或更新本体',
    'fabric.workspace_id': '工作区 ID',
    'fabric.access_token': '访问令牌',
    'fabric.pushing': '推送中…',
    'fabric.success': '成功推送！',
    'fabric.error': '推送失败',

    // NLBuilderModal
    'nlbuilder.title': '自然语言构建器',
    'nlbuilder.subtitle': '使用自然语言创建本体',

    // GuidedTour
    'tour.start': '开始导览',
    'tour.next': '下一步',
    'tour.previous': '上一步',
    'tour.finish': '完成',
    'tour.skip': '跳过',
  },
  en: {
    // Header
    'header.title': 'Ontology Playground',
    'header.preview': '(Preview)',
    'header.points': 'points',
    'header.badges': 'badges',
    'header.share': 'Share',
    'header.share.copied': 'Copied!',
    'header.share.downloaded': 'Downloaded RDF',
    'header.share.encoding': 'Encoding…',
    'header.share.tooltip.catalogue': 'Copy shareable link to this ontology',
    'header.share.tooltip.custom': 'Share this ontology via link',
    'header.summary': 'Summary',
    'header.summary.tooltip': 'View Ontology Summary',
    'header.aibuilder': 'AI Builder',
    'header.catalogue': 'Catalogue',
    'header.designer': 'Designer',
    'header.school': 'Ontology School',
    'header.importexport': 'Import / Export',
    'header.help': 'Help',
    'header.about': 'About',
    'header.datasources': 'Data Sources',
    'header.lightmode': 'Light Mode',
    'header.darkmode': 'Dark Mode',
    'header.language': '中文',
    'header.menu': 'Menu',

    // QuestPanel
    'quest.title': 'Quests',
    'quest.abandon': 'Abandon',
    'quest.earned_badges': 'Earned Badges',
    'quest.total_points': 'Total: {points} points',

    // SearchFilter
    'search.title': 'Search & Filter',
    'search.placeholder': 'Search entities, properties...',
    'search.entities': 'Entities ({count})',
    'search.relationships': 'Relationships ({count})',
    'search.no_results': 'No results for "{query}"',

    // InspectorPanel
    'inspector.title': 'Inspector',
    'inspector.empty.title': 'Select an Element',
    'inspector.empty.text': 'Click on an entity type or relationship in the graph to inspect its properties, data bindings, and connections.',
    'inspector.relationship': 'Relationship',
    'inspector.entity_type': 'Entity Type',
    'inspector.properties': 'Properties ({count})',
    'inspector.relationships': 'Relationships ({count})',
    'inspector.cardinality': 'Cardinality',
    'inspector.rel_attributes': 'Relationship Attributes',
    'inspector.data_bindings': 'Data Bindings',

    // QueryPlayground
    'query.title': 'Natural Language Query (NL2Ontology)',
    'query.placeholder': 'Ask about {name}...',
    'query.try_asking': 'Try asking:',
    'query.clear': 'Clear',
    'query.run': 'Run query',

    // OntologyStatsPanel
    'stats.title': 'Ontology Insights',
    'stats.entities': 'Entities',
    'stats.relationships': 'Relationships',
    'stats.properties': 'Properties',

    // WelcomeModal
    'welcome.title': 'Welcome to Ontology Playground (Preview)',
    'welcome.subtitle': 'Explore Microsoft Fabric IQ Ontology through the lens of Cosmic Coffee Company',
    'welcome.feature.entities.title': 'Entity Types',
    'welcome.feature.entities.text': 'Discover reusable logical models like Customer, Product, and Order',
    'welcome.feature.relationships.title': 'Relationships',
    'welcome.feature.relationships.text': 'See how entities connect with typed, directional links',
    'welcome.feature.bindings.title': 'Data Bindings',
    'welcome.feature.bindings.text': 'Connect ontology concepts to real OneLake data sources',
    'welcome.feature.queries.title': 'NL Queries',
    'welcome.feature.queries.text': 'Ask questions in natural language and traverse the graph',
    'welcome.start': 'Start Exploring',
    'welcome.footer': 'Complete quests to earn badges and learn about Microsoft Fabric IQ Ontology',

    // HelpModal
    'help.title': 'How to Use Ontology Playground (Preview)',
    'help.graph.title': 'Explore the Graph',
    'help.graph.text': 'Click on any <strong>entity type</strong> (colored node) to see its properties, relationships, and data bindings. Click on <strong>relationship lines</strong> to see how entities connect. Use the controls in the bottom-left to zoom and reset the layout.',
    'help.quests.title': 'Complete Quests',
    'help.quests.text': 'Select a quest from the left panel to start a guided journey. Follow the instructions to click on specific entities or relationships. Complete all steps to earn <strong>badges</strong> and <strong>points</strong>!',
    'help.nl.title': 'Ask Natural Language Questions',
    'help.nl.text': 'Use the query playground in the bottom-right to ask questions like "Show me Gold tier customers" or "Which products come from Ethiopia?". The graph will highlight relevant entities and relationships.',
    'help.bindings.title': 'View Data Bindings',
    'help.bindings.text': 'When you select an entity type, the inspector shows how ontology properties map to real data sources in OneLake, including lakehouse tables and Power BI semantic models.',
    'help.about_iq.title': 'About Microsoft Fabric IQ Ontology',
    'help.about_iq.text': 'An ontology is a shared, machine-understandable vocabulary of your business. It defines entity types (like Customer, Product), their properties, and relationships. This demo uses a fictional "Cosmic Coffee Company" to illustrate these concepts.',
    'help.shortcuts.title': 'Keyboard Shortcuts',
    'help.shortcut.palette': 'Open command palette',
    'help.shortcut.help': 'Open this help dialog',
    'help.shortcut.close': 'Close any dialog',
    'help.shortcut.navigate': 'Navigate palette results',
    'help.shortcut.select': 'Select palette command',
    'help.got_it': 'Got it!',

    // AboutModal
    'about.title': 'About Ontology Playground',
    'about.desc1': 'Ontology Playground is a community learning and design experience for building RDF/OWL ontologies, exploring graph relationships, and preparing models compatible with Microsoft Fabric IQ workflows.',
    'about.learn_more': 'Learn more about Microsoft Fabric IQ:',
    'about.trademark.title': 'Trademark Notice',
    'about.trademark.text': 'Trademarks This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow Microsoft\'s Trademark & Brand Guidelines. Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party\'s policies.',
    'about.close': 'Close',

    // GalleryModal
    'gallery.title': 'Ontology Gallery',
    'gallery.subtitle': 'Browse and load ontologies from the catalogue',

    // AppFooter
    'footer.built': 'Built with GitHub Copilot',
    'footer.supervised': 'Supervised by videlalvaro',

    // OntologySummaryModal
    'summary.title': 'Ontology Summary',
    'summary.copy': 'Copy',
    'summary.copied': 'Copied!',
    'summary.entities': 'Entities',
    'summary.relationships': 'Relationships',

    // DataSourcesModal
    'datasources.title': 'Data Sources',
    'datasources.subtitle': 'How the Cosmic Coffee ontology binds to OneLake',
    'datasources.onelake': 'Microsoft OneLake',
    'datasources.onelake_desc': 'Unified data lake for Microsoft Fabric. The ontology binds entity types to tables and semantic models stored here.',

    // ImportExportModal
    'import.title': 'Import / Export',
    'import.subtitle': 'Load your own ontology or export the current one',
    'import.import_btn': 'Import Ontology',
    'import.export_btn': 'Export Ontology',
    'import.reset_btn': 'Reset to default',
    'import.choose_file': 'Choose file',
    'import.success': 'Import successful!',
    'import.error': 'Import failed',
    'import.format_json': 'JSON',
    'import.format_rdf': 'RDF/OWL',

    // PathFinderPanel
    'pathfinder.title': 'Find Shortest Path',
    'pathfinder.from': 'From',
    'pathfinder.to': 'To',
    'pathfinder.find': 'Find',
    'pathfinder.clear': 'Clear',
    'pathfinder.path_found': 'Path found',
    'pathfinder.no_path': 'No connection path',

    // LearnPage
    'learn.title': 'Ontology School',
    'learn.back_playground': 'Playground',
    'learn.all_courses': 'All courses',
    'learn.loading': 'Loading…',
    'learn.error': 'Failed to load learning content',

    // CommandPalette
    'command.palette.placeholder': 'Type a command…',
    'command.palette.no_results': 'No matching commands',

    // FabricExportModal
    'fabric.title': 'Push to Microsoft Fabric',
    'fabric.subtitle': 'Create or update an ontology in your Fabric workspace',
    'fabric.workspace_id': 'Workspace ID',
    'fabric.access_token': 'Access Token',
    'fabric.pushing': 'Pushing…',
    'fabric.success': 'Push successful!',
    'fabric.error': 'Push failed',

    // NLBuilderModal
    'nlbuilder.title': 'Natural Language Builder',
    'nlbuilder.subtitle': 'Create ontologies using natural language',

    // GuidedTour
    'tour.start': 'Start Tour',
    'tour.next': 'Next',
    'tour.previous': 'Previous',
    'tour.finish': 'Finish',
    'tour.skip': 'Skip',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
