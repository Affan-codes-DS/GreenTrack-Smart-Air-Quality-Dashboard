// News Page Functionality
class NewsManager {
    constructor() {
        this.newsData = [];
        this.filteredNews = [];
        this.currentCategory = 'all';
        this.currentRegion = 'global';
        
        // News API Configuration - NewsData.io (browser-compatible)
        this.config = {
            apiKey: localStorage.getItem('newsDataApiKey') || 'pub_eaeb0c2762ca4f9d891403c36b88bd8e',
            apiEndpoint: 'https://newsdata.io/api/1/news',
            useRealAPI: localStorage.getItem('useRealNewsAPI') !== 'false', // Enabled by default
            fallbackToMock: true
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTheme();
        await this.loadNews();
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('theme-light', savedTheme === 'light');

        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
                const next = current === 'light' ? 'dark' : 'light';
                document.body.classList.toggle('theme-light', next === 'light');
                localStorage.setItem('theme', next);
            });
        }
    }

    setupEventListeners() {
        document.getElementById('newsCategory').addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.filterNews();
        });

        document.getElementById('newsRegion').addEventListener('change', (e) => {
            this.currentRegion = e.target.value;
            this.filterNews();
        });

        document.getElementById('refreshNews').addEventListener('click', () => {
            this.loadNews();
        });
    }

    async loadNews() {
        const container = document.getElementById('newsContainer');
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading latest news...</p>
            </div>
        `;

        try {
            // Try to fetch real news if API is enabled
            if (this.config.useRealAPI && this.config.apiKey) {
                this.newsData = await this.fetchRealNews();
                
                // Check if we supplemented with curated data
                const hasCuratedNews = this.newsData.some(article => article.isCurated);
                const realNewsCount = this.newsData.filter(article => !article.isCurated).length;
                
                if (hasCuratedNews) {
                    this.showToast(`${realNewsCount} live + ${this.newsData.length - realNewsCount} curated articles 📰`, 'success');
                } else {
                    this.showToast('Live news loaded successfully! 📰', 'success');
                }
            } else {
                // Use mock data if no API key or real API disabled
                console.log('Using mock news data');
                this.newsData = this.generateMockNews();
                this.showToast('Demo news loaded', 'info');
            }
            
            this.filterNews();
        } catch (error) {
            console.error('Error loading news:', error);
            
            if (this.config.fallbackToMock) {
                console.log('Falling back to mock data due to error:', error.message);
                this.newsData = this.generateMockNews();
                this.filterNews();
                this.showToast('Displaying demo data (API: ' + error.message + ')', 'info');
            } else {
                this.showToast('Failed to load news', 'error');
                container.innerHTML = `
                    <div class="error-state">
                        <p>Failed to load news. Please try again later.</p>
                    </div>
                `;
            }
        }
    }

    async fetchRealNews() {
        console.log('Fetching news from NewsData.io API...');
        const url = `${this.config.apiEndpoint}?apikey=${this.config.apiKey}&q=air%20quality%20OR%20pollution%20OR%20AQI&language=en&category=environment,health`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'success') {
            console.error('API returned error:', data);
            throw new Error('API returned error status');
        }
        
        console.log('✓ API success, got', data.results?.length || 0, 'articles');
        
        // Transform and filter API data
        const articles = data.results
            .map((article, index) => {
                const category = this.categorizeArticle(article.title + ' ' + (article.description || ''));
                
                // Skip articles not related to air quality
                if (!category) return null;
                
                return {
                    id: index + 1,
                    title: article.title || 'Untitled',
                    excerpt: article.description || article.content?.substring(0, 200) || 'No description available',
                    category: category,
                    region: this.detectRegion(article.title + ' ' + (article.description || '') + ' ' + (article.country?.[0] || '')),
                    date: new Date(article.pubDate),
                    source: article.source_id || 'Unknown Source',
                    image: article.image_url || 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=250&fit=crop',
                    url: article.link
                };
            })
            .filter(article => article !== null); // Remove unrelated articles
        
        console.log('✓ Filtered to', articles.length, 'air quality related articles');
        
        // If we have fewer than 12 articles, supplement with curated data
        const minArticles = 12;
        if (articles.length < minArticles) {
            console.log(`Only ${articles.length} real articles found, adding curated content to reach ${minArticles}`);
            const curatedArticles = this.generateMockNews();
            const neededCount = minArticles - articles.length;
            const supplementArticles = curatedArticles.slice(0, neededCount).map((article, index) => ({
                ...article,
                id: articles.length + index + 1,
                isCurated: true // Mark as curated content
            }));
            return [...articles, ...supplementArticles];
        }        return articles;
    }
    
    categorizeArticle(text) {
        const lowerText = text.toLowerCase();
        
        // First check if it's actually air quality related
        const isAirQualityRelated = 
            lowerText.includes('air quality') || 
            lowerText.includes('pollution') || 
            lowerText.includes('aqi') || 
            lowerText.includes('pm2.5') || 
            lowerText.includes('pm10') ||
            lowerText.includes('smog') ||
            lowerText.includes('emissions') ||
            lowerText.includes('pollutants');
        
        // If not air quality related, return null (will be filtered out)
        if (!isAirQualityRelated) {
            return null;
        }
        
        // Now categorize the air quality article
        if (lowerText.includes('aqi') || lowerText.includes('air quality index') || lowerText.includes('monitoring')) {
            return 'aqi';
        }
        if (lowerText.includes('climate') || lowerText.includes('global warming') || lowerText.includes('carbon')) {
            return 'climate';
        }
        if (lowerText.includes('health') || lowerText.includes('disease') || lowerText.includes('hospital') || lowerText.includes('respiratory')) {
            return 'health';
        }
        if (lowerText.includes('policy') || lowerText.includes('regulation') || lowerText.includes('government') || lowerText.includes('law')) {
            return 'policy';
        }
        
        return 'pollution'; // default for air quality articles
    }
    
    detectRegion(text) {
        const lowerText = text.toLowerCase();
        
        // India-specific keywords
        if (lowerText.match(/india|delhi|mumbai|bangalore|chennai|kolkata|indian/i)) {
            return 'india';
        }
        // Asia keywords
        if (lowerText.match(/china|japan|korea|singapore|bangkok|manila|jakarta|beijing|shanghai|tokyo|seoul|asia/i)) {
            return 'asia';
        }
        // Europe keywords
        if (lowerText.match(/europe|london|paris|berlin|madrid|rome|uk|france|germany|spain|italy/i)) {
            return 'europe';
        }
        // Americas keywords
        if (lowerText.match(/america|usa|canada|mexico|brazil|new york|los angeles|chicago|toronto/i)) {
            return 'americas';
        }
        // Africa keywords
        if (lowerText.match(/africa|cairo|lagos|johannesburg|nairobi|egypt|nigeria|south africa|kenya/i)) {
            return 'africa';
        }
        
        return 'global'; // default
    }

    generateMockNews() {
        const categories = ['pollution', 'aqi', 'climate', 'health', 'policy'];
        const regions = ['asia', 'india', 'europe', 'americas', 'africa', 'global'];
        
        const newsTemplates = [
            {
                title: 'Delhi Air Quality Reaches Hazardous Levels as Winter Smog Intensifies',
                excerpt: 'The national capital records AQI above 400 as stubble burning and vehicular emissions combine with winter conditions to create severe smog conditions.',
                category: 'pollution',
                region: 'india',
                date: new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1578929859078-9ed7f5b5e78e?w=400&h=250&fit=crop',
                source: 'Times of India Environment',
                url: 'https://www.who.int/india/health-topics/air-pollution'
            },
            {
                title: 'Mumbai Implements Odd-Even Vehicle Scheme to Combat Rising Pollution',
                excerpt: 'Maharashtra government introduces traffic restrictions as the city battles deteriorating air quality during festive season, affecting millions of commuters.',
                category: 'policy',
                region: 'india',
                date: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1570733577845-13549a5b3b5a?w=400&h=250&fit=crop',
                source: 'Indian Express Environmental',
                url: 'https://www.unep.org/news-and-stories/story/indias-fight-against-air-pollution'
            },
            {
                title: 'NCAP Initiative Shows 10% Reduction in PM2.5 Levels Across Indian Cities',
                excerpt: 'National Clean Air Programme reports measurable improvements in 102 non-attainment cities, marking progress in India\'s battle against air pollution.',
                category: 'aqi',
                region: 'india',
                date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=250&fit=crop',
                source: 'Ministry of Environment India',
                url: 'https://www.epa.gov/air-research/research-health-effects-air-pollution'
            },
            {
                title: 'Bangalore Tech Parks Install Air Purifiers as Pollution Concerns Grow',
                excerpt: 'Major IT companies in India\'s Silicon Valley invest in air quality infrastructure to protect employee health amid rising particulate matter levels.',
                category: 'health',
                region: 'india',
                date: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop',
                source: 'Economic Times Health',
                url: 'https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home'
            },
            {
                title: 'Indo-Gangetic Plain Faces Severe Air Quality Crisis During Crop Burning Season',
                excerpt: 'States of Punjab, Haryana, and UP report alarming pollution levels as agricultural waste burning coincides with cooler weather, trapping pollutants.',
                category: 'pollution',
                region: 'india',
                date: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=250&fit=crop',
                source: 'Down To Earth Magazine',
                url: 'https://www.unep.org/news-and-stories/story/air-pollution-hurts-poorest-most'
            },
            {
                title: 'Indian Railways Launches Green Corridor Initiative for Cleaner Air',
                excerpt: 'Railway ministry announces massive tree plantation drive along tracks and shift to renewable energy to reduce carbon footprint and improve air quality.',
                category: 'climate',
                region: 'india',
                date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=400&h=250&fit=crop',
                source: 'Railway Board Environmental Cell',
                url: 'https://www.iea.org/topics/clean-energy-technologies'
            },
            {
                title: 'Major Cities Report Significant Improvement in Air Quality',
                excerpt: 'Several metropolitan areas have shown remarkable progress in reducing air pollution levels through strict emission controls and green initiatives.',
                category: 'aqi',
                region: 'global',
                date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400&h=250&fit=crop',
                source: 'Environmental News Network',
                url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health'
            },
            {
                title: 'New Study Links Air Pollution to Increased Heart Disease Risk',
                excerpt: 'Research indicates that long-term exposure to high levels of particulate matter significantly increases cardiovascular disease risk in urban populations.',
                category: 'health',
                region: 'americas',
                date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=250&fit=crop',
                source: 'Health Today',
                url: 'https://www.epa.gov/air-research/research-health-effects-air-pollution'
            },
            {
                title: 'Government Introduces Stricter Vehicle Emission Standards',
                excerpt: 'New regulations aim to reduce vehicular pollution by 40% over the next five years through adoption of cleaner fuel standards.',
                category: 'policy',
                region: 'europe',
                date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop',
                source: 'Policy Watch',
                url: 'https://www.epa.gov/regulatory-information-topic/regulatory-information-topic-air'
            },
            {
                title: 'Industrial Emissions Drop 25% Following Green Technology Adoption',
                excerpt: 'Manufacturing sector shows significant reduction in pollutant emissions after implementing advanced filtration and clean energy solutions.',
                category: 'pollution',
                region: 'asia',
                date: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=250&fit=crop',
                source: 'Industrial Review',
                url: 'https://www.unep.org/news-and-stories/story/air-pollution-hurts-poorest-most'
            },
            {
                title: 'Climate Change Intensifies Air Quality Concerns',
                excerpt: 'Rising temperatures and changing weather patterns are creating conditions that trap pollutants and worsen air quality in many regions.',
                category: 'climate',
                region: 'global',
                date: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=250&fit=crop',
                source: 'Climate Science Daily',
                url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/'
            },
            {
                title: 'Air Quality Monitoring Network Expands to Rural Areas',
                excerpt: 'Government initiative deploys hundreds of new sensors to track air pollution in previously unmonitored regions.',
                category: 'aqi',
                region: 'africa',
                date: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=250&fit=crop',
                source: 'Tech Environmental',
                url: 'https://waqi.info/'
            },
            {
                title: 'Schools Close as Smog Reaches Hazardous Levels',
                excerpt: 'Authorities order temporary school closures and outdoor activity restrictions as air quality index reaches dangerous levels.',
                category: 'health',
                region: 'asia',
                date: new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=250&fit=crop',
                source: 'Daily Health Reporter',
                url: 'https://www.unicef.org/reports/air-pollution-and-children'
            },
            {
                title: 'Electric Vehicle Sales Surge Amid Pollution Concerns',
                excerpt: 'Consumer demand for electric vehicles reaches record high as awareness of vehicular pollution impact grows.',
                category: 'pollution',
                region: 'americas',
                date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=250&fit=crop',
                source: 'Auto Environmental News',
                url: 'https://www.iea.org/reports/global-ev-outlook-2023'
            },
            {
                title: 'International Summit Addresses Cross-Border Air Pollution',
                excerpt: 'World leaders convene to discuss collaborative strategies for reducing transboundary air pollution affecting multiple nations.',
                category: 'policy',
                region: 'global',
                date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b0?w=400&h=250&fit=crop',
                source: 'Global Policy Forum',
                url: 'https://www.ccacoalition.org/en'
            },
            {
                title: 'Urban Green Spaces Shown to Reduce Local Air Pollution',
                excerpt: 'New research demonstrates that parks and green infrastructure can significantly improve air quality in urban neighborhoods.',
                category: 'climate',
                region: 'europe',
                date: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop',
                source: 'Urban Planning Review',
                url: 'https://www.nature.com/articles/s41370-020-0243-3'
            },
            {
                title: 'Air Purifier Sales Double as Public Awareness Grows',
                excerpt: 'Consumer market for air purification systems expands rapidly as people seek to protect indoor air quality.',
                category: 'health',
                region: 'asia',
                date: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
                source: 'Consumer Health Digest',
                url: 'https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home'
            },
            {
                title: 'Wildfire Smoke Impacts Air Quality Across Continent',
                excerpt: 'Unprecedented wildfire season sends smoke particles across thousands of miles, affecting air quality in distant regions.',
                category: 'pollution',
                region: 'americas',
                date: new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000),
                image: 'https://images.unsplash.com/photo-1590621282253-83f59e39c1a9?w=400&h=250&fit=crop',
                source: 'Fire & Environment Watch',
                url: 'https://www.nature.com/articles/d41586-023-02730-1'
            }
        ];

        return newsTemplates.map((template, index) => ({
            ...template,
            id: index + 1
        }));
    }

    filterNews() {
        this.filteredNews = this.newsData.filter(article => {
            const categoryMatch = this.currentCategory === 'all' || article.category === this.currentCategory;
            const regionMatch = this.currentRegion === 'global' || article.region === this.currentRegion;
            return categoryMatch && regionMatch;
        });

        this.displayNews();
    }

    displayNews() {
        const container = document.getElementById('newsContainer');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredNews.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        // Add event listeners to all Read More buttons after rendering
        setTimeout(() => {
            document.querySelectorAll('.read-more-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const articleId = parseInt(e.currentTarget.getAttribute('data-article-id'));
                    this.showArticleDetails(articleId);
                });
            });
        }, 0);

        container.innerHTML = this.filteredNews.map(article => `
            <article class="news-card animated-card">
                <div class="news-image" style="background-image: url('${article.image}')">
                    <span class="news-category ${article.category}">${this.getCategoryLabel(article.category)}</span>
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${this.formatDate(article.date)}
                        </span>
                        <span class="news-region">${this.getRegionLabel(article.region)}</span>
                    </div>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-excerpt">${article.excerpt}</p>
                    <div class="news-footer">
                        <span class="news-source">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
                            </svg>
                            ${article.source}
                        </span>
                        <button class="read-more-btn" data-article-id="${article.id}">
                            Read More →
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    getCategoryLabel(category) {
        const labels = {
            'pollution': 'Pollution',
            'aqi': 'Air Quality',
            'climate': 'Climate',
            'health': 'Health',
            'policy': 'Policy'
        };
        return labels[category] || category;
    }

    getRegionLabel(region) {
        const labels = {
            'global': '🌍 Global',
            'asia': '🌏 Asia',
            'india': '🇮🇳 India',
            'europe': '🇪🇺 Europe',
            'americas': '🌎 Americas',
            'africa': '🌍 Africa'
        };
        return labels[region] || region;
    }

    formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    showArticleDetails(articleId) {
        const article = this.newsData.find(a => a.id === articleId);
        if (!article) return;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'article-modal';
        modal.innerHTML = `
            <div class="article-modal-content">
                <button class="modal-close" onclick="this.closest('.article-modal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="article-modal-header">
                    <img src="${article.image}" alt="${article.title}">
                    <div class="article-modal-meta">
                        <span class="news-category ${article.category}">${this.getCategoryLabel(article.category)}</span>
                        <span class="news-region">${this.getRegionLabel(article.region)}</span>
                        <span class="news-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${this.formatDate(article.date)}
                        </span>
                    </div>
                </div>
                <div class="article-modal-body">
                    <h2>${article.title}</h2>
                    <p class="article-source">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
                        </svg>
                        Source: ${article.source}
                    </p>
                    <div class="article-content">
                        <p>${article.excerpt}</p>
                        <p>This is a demonstration of the news feature. In a production environment, this would display the full article content fetched from a news API or RSS feed.</p>
                        <p>Key topics covered in this article include environmental monitoring, pollution control measures, health impact assessments, and policy recommendations from experts in the field.</p>
                    </div>
                    <div class="article-actions">
                        <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Read Full Article
                        </a>
                        <button class="btn-secondary" onclick="navigator.share ? navigator.share({title: '${article.title}', text: '${article.excerpt.substring(0, 100)}...'}) : alert('Share functionality')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    configureNewsAPI(apiKey) {
        localStorage.setItem('newsDataApiKey', apiKey);
        this.config.apiKey = apiKey;
        localStorage.setItem('useRealNewsAPI', 'true');
        this.config.useRealAPI = true;
        
        this.showToast('API configured successfully! Refreshing news...', 'success');
        this.loadNews();
    }
    
    disableRealAPI() {
        localStorage.setItem('useRealNewsAPI', 'false');
        this.config.useRealAPI = false;
        this.showToast('Switched to demo mode', 'info');
        this.loadNews();
    }

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        toast.innerHTML = `
            ${icons[type] || icons.info}
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Initialize news manager when DOM is loaded
let newsManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        newsManager = new NewsManager();
    });
} else {
    newsManager = new NewsManager();
}
