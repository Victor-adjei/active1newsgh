document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase Client
    const supabaseUrl = 'https://ymvbgydxdtpodiuqvfgj.supabase.co';
    const supabaseKey = 'sb_publishable_fVUQi5fULk173enaoK138g_vDjLvIzR';
    const supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                if (mainNav.classList.contains('active')) {
                    icon.className = 'fa-solid fa-xmark';
                } else {
                    icon.className = 'fa fa-bars';
                }
            }
        });
    }

    // Render Articles function (filters dynamically from Supabase!)
    window.renderArticles = async function(filterCategory = 'all') {
        const bentoGrid = document.getElementById('bentoGrid');
        const latestNewsGrid = document.getElementById('latestNewsGrid');
        if (!bentoGrid || !latestNewsGrid) return;

        let savedArticles = [];
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .order('timestamp', { ascending: false });
                if (!error && data) {
                    savedArticles = data;
                } else {
                    console.error("Supabase fetch error:", error);
                    savedArticles = JSON.parse(localStorage.getItem('active1news_articles')) || [];
                }
            } catch (err) {
                console.error("Failed to connect to Supabase:", err);
                savedArticles = JSON.parse(localStorage.getItem('active1news_articles')) || [];
            }
        } else {
            savedArticles = JSON.parse(localStorage.getItem('active1news_articles')) || [];
        }

        // Cache it globally for search and detailed viewing without multiple fetch hits
        window.loadedArticles = savedArticles;

        if (savedArticles.length === 0) {
            bentoGrid.innerHTML = '';
            latestNewsGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); margin-top:40px;">No articles published yet.</p>`;
            return;
        }

        // Sort newest first
        let articles = savedArticles.slice();

        // Apply Category Filter
        if (filterCategory !== 'all') {
            articles = articles.filter(a => a.category.toLowerCase() === filterCategory.toLowerCase());
        }

        bentoGrid.innerHTML = '';
        latestNewsGrid.innerHTML = '';

        if (articles.length === 0) {
            // No matches for this category
            bentoGrid.style.display = 'none';
            latestNewsGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding: 60px 20px; color:var(--text-muted);">
                    <div style="font-size:3.5rem; margin-bottom:15px; color:#cbd5e1;"><i class="fa-solid fa-folder-open"></i></div>
                    <h3>No articles in "${filterCategory.toUpperCase()}" yet</h3>
                    <p style="font-size:0.95rem; margin-top:5px;">Stay tuned! Fresh updates are on the way.</p>
                </div>
            `;
            return;
        } else {
            bentoGrid.style.display = 'grid';
        }

        // Render Bento Grid (Top 4 of filtered list)
        const bentoArticles = articles.slice(0, 4);
        const latestArticles = articles.slice(4);

        bentoArticles.forEach((article, index) => {
            const dateStr = new Date(article.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const classMap = ['bento-large', 'bento-small', 'bento-small', 'bento-wide'];
            const cardClass = classMap[index] || 'bento-small';

            let mediaHtml = '';
            if (article.isVideo && article.mediaUrl) {
                if (article.mediaUrl.includes('youtube.com') || article.mediaUrl.includes('youtu.be')) {
                    let videoId = article.mediaUrl.includes('youtube.com') ? article.mediaUrl.split('v=')[1] : article.mediaUrl.split('.be/')[1];
                    if (videoId) {
                        const ampersandPosition = videoId.indexOf('&');
                        if (ampersandPosition !== -1) videoId = videoId.substring(0, ampersandPosition);
                        
                        if (index === 0) { // Large main card
                            mediaHtml = `
                                <div class="video-background" style="position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden;">
                                    <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0" frameborder="0" allow="autoplay; encrypted-media" style="position: absolute; top: 50%; left: 50%; width: 150vw; height: 150vh; transform: translate(-50%, -50%); pointer-events: none;"></iframe>
                                </div>
                                <div class="play-btn-overlay"><i class="fa-solid fa-play"></i></div>
                            `;
                        } else {
                            mediaHtml = `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${article.title}" style="object-fit:cover; width:100%; height:100%;">
                                         <div class="play-btn-overlay" style="width:40px; height:40px; font-size:1rem;"><i class="fa-solid fa-play"></i></div>`;
                        }
                    }
                } else {
                    mediaHtml = `
                        <div class="video-background" style="position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden;">
                            <video src="${article.mediaUrl}" autoplay loop muted style="object-fit: cover; width: 100%; height: 100%; pointer-events: none;"></video>
                        </div>
                    `;
                }
            } else if (article.mediaUrl) {
                mediaHtml = `<img src="${article.mediaUrl}" alt="${article.title}" style="object-fit:cover; width:100%; height:100%;">`;
            } else {
                mediaHtml = `<div style="width:100%; height:100%; background:var(--bg-sidebar);"></div>`;
            }

            const tagColors = {
                'news': 'tag-red',
                'politics': 'tag-red',
                'entertainment': 'tag-blue',
                'sports': 'tag-green',
                'business': 'tag-purple',
                'tech': 'tag-purple'
            };
            const tagClass = tagColors[article.category] || '';

            const bentoHtml = `
                <article class="bento-card ${cardClass} group" onclick="openArticleDetail(${article.timestamp})" style="cursor: pointer;">
                    ${mediaHtml}
                    <div class="card-overlay"></div>
                    <div class="card-content">
                        <span class="category-tag ${tagClass}">${article.category.toUpperCase()}</span>
                        <h2 class="${index === 0 ? 'card-title' : 'card-title-sm'}">${article.title}</h2>
                        ${index === 0 ? `
                        <div class="card-meta">
                            <span><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                        </div>` : ''}
                    </div>
                </article>
            `;
            bentoGrid.insertAdjacentHTML('beforeend', bentoHtml);
        });

        // Render Latest Updates Grid
        if (latestArticles.length > 0) {
            latestArticles.forEach((article) => {
                const dateStr = new Date(article.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                let mediaHtml = '';
                if (article.mediaUrl) {
                    if (article.isVideo && (article.mediaUrl.includes('youtube.com') || article.mediaUrl.includes('youtu.be'))) {
                        let videoId = article.mediaUrl.includes('youtube.com') ? article.mediaUrl.split('v=')[1] : article.mediaUrl.split('.be/')[1];
                        if (videoId) {
                            const ampersandPosition = videoId.indexOf('&');
                            if (ampersandPosition !== -1) videoId = videoId.substring(0, ampersandPosition);
                            mediaHtml = `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${article.title}" style="object-fit:cover; width:100%; height:100%;">`; 
                        }
                    } else if (article.isVideo) {
                        mediaHtml = `<video src="${article.mediaUrl}" style="object-fit:cover; width:100%; height:100%; pointer-events: none;"></video>`;
                    } else {
                        mediaHtml = `<img src="${article.mediaUrl}" alt="${article.title}" style="object-fit:cover; width:100%; height:100%;">`;
                    }
                } else {
                    mediaHtml = `<div style="width:100%; height:100%; background:var(--bg-sidebar); display:flex; align-items:center; justify-content:center;"><i class="fa fa-newspaper" style="font-size:3rem; color:var(--text-muted)"></i></div>`;
                }

                const cardHtml = `
                    <div class="news-card" onclick="openArticleDetail(${article.timestamp})" style="cursor: pointer;">
                        <div class="img-wrapper">
                            ${mediaHtml}
                        </div>
                        <div class="news-card-content">
                            <span class="meta-date">${dateStr}</span>
                            <h4 class="news-title">${article.title}</h4>
                            <p class="news-excerpt">${article.content.substring(0, 80)}${article.content.length > 80 ? '...' : ''}</p>
                            <a href="#" class="read-more" onclick="event.preventDefault();">Read Full Story</a>
                        </div>
                    </div>
                `;
                latestNewsGrid.insertAdjacentHTML('beforeend', cardHtml);
            });
        } else if (bentoArticles.length === 4) {
            latestNewsGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:20px;">No additional updates in this category.</p>`;
        }
    };

    // Run initial render for all articles
    window.renderArticles('all');

    // Wire category navigation link clicks to filter dynamically
    const navAnchors = document.querySelectorAll('.nav-links a:not(#aboutMenuLink)');
    navAnchors.forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all nav items
            navAnchors.forEach(a => a.classList.remove('active'));
            // Add active to current
            anchor.classList.add('active');
            
            // Get category matching text
            const categoryText = anchor.textContent.trim().toLowerCase();
            
            if (categoryText === 'home') {
                window.renderArticles('all');
            } else {
                window.renderArticles(categoryText);
            }
            
            // Close mobile menu if active
            const mainNav = document.getElementById('mainNav');
            if(mainNav) mainNav.classList.remove('active');
        });
    });

    // Helper function for formatting time
    function formatTimeAgo(timestamp) {
        const diffMs = Date.now() - timestamp;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    // Helper to render comments list
    function renderCommentsList(comments) {
        const listContainer = document.getElementById('modalCommentsList');
        const countBadge = document.getElementById('modalCommentsCount');
        if (!listContainer || !countBadge) return;
        
        countBadge.innerText = comments.length;
        
        if (comments.length === 0) {
            listContainer.innerHTML = `<p style="color:var(--text-muted); font-style:italic; margin-top: 10px;">No comments yet. Be the first to share your thoughts!</p>`;
            return;
        }

        listContainer.innerHTML = comments.map(c => {
            const initial = c.name ? c.name.charAt(0).toUpperCase() : 'A';
            const timeAgo = formatTimeAgo(c.timestamp);
            return `
                <div class="comment-item">
                    <div class="comment-avatar">${initial}</div>
                    <div class="comment-content">
                        <div class="comment-meta">
                            <strong>${c.name}</strong> <span>${timeAgo}</span>
                        </div>
                        <div class="comment-text">${c.text}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Global Article Modal Handler
    window.openArticleDetail = function(articleTimestamp) {
        const savedArticles = window.loadedArticles || JSON.parse(localStorage.getItem('active1news_articles')) || [];
        const actualIdx = savedArticles.findIndex(a => a.timestamp === parseFloat(articleTimestamp));
        if (actualIdx === -1) return;
        const article = savedArticles[actualIdx];
        
        const modal = document.getElementById('articleModal');
        const mCategory = document.getElementById('modalCategory');
        const mTitle = document.getElementById('modalTitle');
        const mMeta = document.getElementById('modalMeta');
        const mMedia = document.getElementById('modalMedia');
        const mContent = document.getElementById('modalContent');
        
        if(!modal || !mCategory || !mTitle || !mMeta || !mMedia || !mContent) return;

        // Populate details
        mCategory.innerText = article.category.toUpperCase();
        
        // Match tag color
        const tagColors = {
            'news': 'tag-red',
            'politics': 'tag-red',
            'entertainment': 'tag-blue',
            'sports': 'tag-green',
            'business': 'tag-purple',
            'tech': 'tag-purple'
        };
        mCategory.className = `category-tag ${tagColors[article.category] || 'tag-red'}`;
        
        mTitle.innerText = article.title;
        mContent.innerText = article.content;
        
        const dateStr = new Date(article.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        mMeta.innerHTML = `<i class="fa-regular fa-clock"></i> Published on ${dateStr}`;
        
        // Render media inside modal
        let mediaHtml = '';
        if (article.mediaUrl) {
            if (article.isVideo) {
                if (article.mediaUrl.includes('youtube.com') || article.mediaUrl.includes('youtu.be')) {
                    let videoId = article.mediaUrl.includes('youtube.com') ? article.mediaUrl.split('v=')[1] : article.mediaUrl.split('.be/')[1];
                    if (videoId) {
                        const ampersandPosition = videoId.indexOf('&');
                        if (ampersandPosition !== -1) videoId = videoId.substring(0, ampersandPosition);
                        mediaHtml = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; aspect-ratio:16/9; border-radius:8px;"></iframe>`;
                    }
                } else {
                    // Direct video file base64 or url
                    mediaHtml = `<video src="${article.mediaUrl}" controls autoplay style="width:100%; max-height:450px; border-radius:8px;"></video>`;
                }
            } else {
                // Regular image
                mediaHtml = `<img src="${article.mediaUrl}" alt="${article.title}" style="width:100%; border-radius:8px; object-fit:cover;">`;
            }
        }
        mMedia.innerHTML = mediaHtml;

        // Render dynamic comments
        const comments = article.comments || [];
        renderCommentsList(comments);

        // Bind share links dynamically
        const whatsappBtn = document.getElementById('shareWhatsApp');
        const facebookBtn = document.getElementById('shareFacebook');
        const xBtn = document.getElementById('shareX');
        const tiktokBtn = document.getElementById('shareTikTok');
        const copyBtn = document.getElementById('shareCopy');
        
        // Use clean sharing URL (simulation fallback if running locally)
        const shareUrl = window.location.href.startsWith('file:') 
            ? 'https://active1newsgh.com' 
            : window.location.origin + window.location.pathname;
        const shareTitle = article.title;
        
        if(whatsappBtn) whatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' - ' + shareUrl)}`;
        if(facebookBtn) facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        if(xBtn) xBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
        
        if(tiktokBtn) {
            tiktokBtn.onclick = function() {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("🔗 Link Copied to Clipboard!\n\nOpening TikTok... You can paste the link in your bio, post description, or DMs to share this news!");
                    window.open("https://www.tiktok.com", "_blank");
                });
            };
        }

        if(copyBtn) {
            copyBtn.onclick = function() {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    const originalHtml = copyBtn.innerHTML;
                    copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHtml;
                    }, 2000);
                });
            };
        }

        // Bind comment form submit dynamically for this specific article
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.onsubmit = async function(e) {
                e.preventDefault();
                const nameInput = document.getElementById('commenterName');
                const textInput = document.getElementById('commenterText');
                
                const commenterName = nameInput.value.trim() || 'Anonymous';
                const commenterText = textInput.value.trim();
                
                if (!commenterText) return;
                
                const currentArticle = article;
                if (!currentArticle) return;
                
                if (!currentArticle.comments) currentArticle.comments = [];
                currentArticle.comments.push({
                    name: commenterName,
                    text: commenterText,
                    timestamp: Date.now()
                });
                
                // Save it back to Supabase
                if (supabase) {
                    try {
                        const { error } = await supabase
                            .from('articles')
                            .update({ comments: currentArticle.comments })
                            .eq('timestamp', currentArticle.timestamp);
                        if (error) console.error("Error saving comment to Supabase:", error);
                    } catch(err) {
                        console.error("Supabase failed:", err);
                    }
                }
                
                // Keep local storage in sync as a backup
                const localArticles = JSON.parse(localStorage.getItem('active1news_articles')) || [];
                const localIdx = localArticles.findIndex(a => a.timestamp === currentArticle.timestamp);
                if (localIdx !== -1) {
                    localArticles[localIdx] = currentArticle;
                    localStorage.setItem('active1news_articles', JSON.stringify(localArticles));
                }
                
                // Clear text field
                nameInput.value = '';
                textInput.value = '';
                
                // Re-render comments
                renderCommentsList(currentArticle.comments);
            };
        }
        
        // Show modal smoothly
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    };

    // Close Modal Handler
    const modal = document.getElementById('articleModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                // Stop playing video/audio by clearing media HTML
                const mMedia = document.getElementById('modalMedia');
                if(mMedia) mMedia.innerHTML = '';
            }, 400);
        });

        // Also close if clicking overlay itself
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModalBtn.click();
            }
        });
    }

    // Dynamic About Modal toggles
    const aboutMenuLink = document.getElementById('aboutMenuLink');
    const aboutModal = document.getElementById('aboutModal');
    const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');
    
    if (aboutMenuLink && aboutModal) {
        aboutMenuLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutModal.style.display = 'flex';
            setTimeout(() => {
                aboutModal.classList.add('active');
            }, 10);
            
            // Close mobile menu if active
            const mainNav = document.getElementById('mainNav');
            if(mainNav) mainNav.classList.remove('active');
        });
    }
    
    if (closeAboutModalBtn && aboutModal) {
        closeAboutModalBtn.addEventListener('click', () => {
            aboutModal.classList.remove('active');
            setTimeout(() => {
                aboutModal.style.display = 'none';
            }, 400);
        });
        
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                closeAboutModalBtn.click();
            }
        });
    }

    // ==========================================
    // 🔍 1. LIVE SEARCH ENGINE DYNAMICS
    // ==========================================
    const searchNavBtn = document.getElementById('searchNavBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const articleSearchInput = document.getElementById('articleSearchInput');
    const searchResultsList = document.getElementById('searchResultsList');

    if (searchNavBtn && searchModal) {
        searchNavBtn.addEventListener('click', () => {
            searchModal.style.display = 'flex';
            setTimeout(() => {
                searchModal.classList.add('active');
                articleSearchInput.focus();
            }, 10);
        });
    }

    if (closeSearchBtn && searchModal) {
        const resetSearch = () => {
            searchModal.classList.remove('active');
            setTimeout(() => {
                searchModal.style.display = 'none';
                articleSearchInput.value = '';
                searchResultsList.innerHTML = `<p style="color:var(--text-muted); text-align:center; font-style:italic; margin-top:20px;">Type something to start searching...</p>`;
            }, 400);
        };
        closeSearchBtn.addEventListener('click', resetSearch);
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) resetSearch();
        });
    }

    if (articleSearchInput && searchResultsList) {
        articleSearchInput.addEventListener('input', () => {
            const query = articleSearchInput.value.trim().toLowerCase();
            if (!query) {
                searchResultsList.innerHTML = `<p style="color:var(--text-muted); text-align:center; font-style:italic; margin-top:20px;">Type something to start searching...</p>`;
                return;
            }

            const savedArticles = window.loadedArticles || JSON.parse(localStorage.getItem('active1news_articles')) || [];
            // Map articles to their index in the reversed list (which window.openArticleDetail expects)
            const reversedArticles = savedArticles.slice();

            const matches = [];
            reversedArticles.forEach((article, index) => {
                if (article.title.toLowerCase().includes(query) || article.content.toLowerCase().includes(query) || article.category.toLowerCase().includes(query)) {
                    matches.push({ article, index });
                }
            });

            if (matches.length === 0) {
                searchResultsList.innerHTML = `<p style="color:var(--text-muted); text-align:center; margin-top:20px;"><i class="fa-solid fa-face-frown"></i> No articles found matching "${query}".</p>`;
                return;
            }

            searchResultsList.innerHTML = matches.map(match => {
                const art = match.article;
                let mediaHtml = `<div class="search-result-img" style="display:flex; align-items:center; justify-content:center;"><i class="fa fa-newspaper" style="color:var(--text-muted)"></i></div>`;
                
                if (art.mediaUrl) {
                    if (art.isVideo && (art.mediaUrl.includes('youtube.com') || art.mediaUrl.includes('youtu.be'))) {
                        let videoId = art.mediaUrl.includes('youtube.com') ? art.mediaUrl.split('v=')[1] : art.mediaUrl.split('.be/')[1];
                        if (videoId) {
                            const ampersandPosition = videoId.indexOf('&');
                            if (ampersandPosition !== -1) videoId = videoId.substring(0, ampersandPosition);
                            mediaHtml = `<img src="https://img.youtube.com/vi/${videoId}/default.jpg" class="search-result-img">`;
                        }
                    } else if (art.isVideo) {
                        mediaHtml = `<div class="search-result-img" style="display:flex; align-items:center; justify-content:center; background:#000;"><i class="fa fa-play" style="color:#fff; font-size:0.8rem;"></i></div>`;
                    } else {
                        mediaHtml = `<img src="${art.mediaUrl}" class="search-result-img">`;
                    }
                }

                const dateStr = new Date(art.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return `
                    <div class="search-result-item" onclick="triggerOpenFromSearch(${art.timestamp})">
                        ${mediaHtml}
                        <div class="search-result-info">
                            <h4 class="search-result-title">${art.title}</h4>
                            <span class="search-result-meta">${art.category.toUpperCase()} • ${dateStr}</span>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    window.triggerOpenFromSearch = function(timestamp) {
        // Close search modal first
        const searchModal = document.getElementById('searchModal');
        if(searchModal) {
            searchModal.classList.remove('active');
            setTimeout(() => {
                searchModal.style.display = 'none';
                // Open dynamic reader modal!
                window.openArticleDetail(timestamp);
            }, 300);
        }
    };

    // ==========================================
    // ✉️ 2. NEWSLETTER SUBSCRIPTION DYNAMICS
    // ==========================================
    const subscribeNavBtn = document.getElementById('subscribeNavBtn');
    const subscribeModal = document.getElementById('subscribeModal');
    const closeSubscribeBtn = document.getElementById('closeSubscribeBtn');
    const modalSubscribeForm = document.getElementById('modalSubscribeForm');

    if (subscribeNavBtn && subscribeModal) {
        subscribeNavBtn.addEventListener('click', () => {
            subscribeModal.style.display = 'flex';
            setTimeout(() => {
                subscribeModal.classList.add('active');
            }, 10);
        });
    }

    if (closeSubscribeBtn && subscribeModal) {
        const resetSubscribe = () => {
            subscribeModal.classList.remove('active');
            setTimeout(() => {
                subscribeModal.style.display = 'none';
                modalSubscribeForm.reset();
            }, 400);
        };
        closeSubscribeBtn.addEventListener('click', resetSubscribe);
        subscribeModal.addEventListener('click', (e) => {
            if (e.target === subscribeModal) resetSubscribe();
        });
    }

    if (modalSubscribeForm) {
        modalSubscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('subscribeEmail');
            const email = emailInput.value.trim();
            if (!email) return;

            // Collect selected categories
            const interests = [];
            const checkboxes = modalSubscribeForm.querySelectorAll('input[name="interest"]:checked');
            checkboxes.forEach(cb => interests.push(cb.value));

            // Persist Subscriber state
            const subscriber = {
                email: email,
                categories: interests,
                subscribedAt: Date.now()
            };
            localStorage.setItem('active1news_subscriber', JSON.stringify(subscriber));

            // Show Success Notification
            alert(`🎉 Thank you for subscribing to Active1NewsGH!\n\nEmail: ${email}\nCategories: ${interests.join(', ').toUpperCase()}\n\nYou are now signed up for premium notifications!`);

            // Close Modal
            if(closeSubscribeBtn) closeSubscribeBtn.click();
        });
    }

    const footerSubscribeForm = document.getElementById('footerSubscribeForm');
    if (footerSubscribeForm) {
        footerSubscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('footerSubscribeEmail');
            const email = emailInput.value.trim();
            if (!email) return;

            // Collect selected categories
            const interests = [];
            const checkboxes = footerSubscribeForm.querySelectorAll('input[name="footerInterest"]:checked');
            checkboxes.forEach(cb => interests.push(cb.value));

            // Persist Subscriber state
            const subscriber = {
                email: email,
                categories: interests,
                subscribedAt: Date.now()
            };
            localStorage.setItem('active1news_subscriber', JSON.stringify(subscriber));

            // Show Success Notification
            alert(`🎉 Thank you for subscribing to Active1NewsGH!\n\nEmail: ${email}\nCategories: ${interests.join(', ').toUpperCase()}\n\nYou are now signed up for premium notifications!`);
            
            // Reset form
            footerSubscribeForm.reset();
        });
    }

    // ==========================================
    // 🔔 3. DYNAMIC NOTIFICATION BELL ALERTS
    // ==========================================
    const bellNavBtn = document.getElementById('bellNavBtn');
    const bellBadge = document.getElementById('bellBadge');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationsList = document.getElementById('notificationsList');

    // Default notifications seed
    let notifications = JSON.parse(localStorage.getItem('active1news_notifications'));
    if (!notifications) {
        notifications = [
            {
                id: 1,
                text: "📢 Welcome to Active1NewsGH! Explore breaking news, sports features, and premium video updates.",
                timestamp: Date.now() - 3600000 * 2, // 2 hours ago
                unread: true
            },
            {
                id: 2,
                text: "🔥 Trending: Check out our freshly detailed About Us social media deck!",
                timestamp: Date.now() - 3600000 * 24, // 1 day ago
                unread: true
            }
        ];
        localStorage.setItem('active1news_notifications', JSON.stringify(notifications));
    }

    // Render alert indicators
    function renderAlertStates() {
        const currentNotifications = JSON.parse(localStorage.getItem('active1news_notifications')) || [];
        const unreadCount = currentNotifications.filter(n => n.unread).length;
        
        if (unreadCount > 0) {
            bellBadge.style.display = 'block';
        } else {
            bellBadge.style.display = 'none';
        }

        if (notificationsList) {
            if (currentNotifications.length === 0) {
                notificationsList.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; font-style:italic; padding: 10px;">No alerts at this time.</p>`;
                return;
            }

            notificationsList.innerHTML = currentNotifications.map(n => {
                const timeStr = formatTimeAgo(n.timestamp);
                const unreadClass = n.unread ? 'unread' : '';
                return `
                    <div class="notification-item ${unreadClass}">
                        <div>${n.text}</div>
                        <span class="time">${timeStr}</span>
                    </div>
                `;
            }).join('');
        }
    }

    renderAlertStates();

    // Toggle Dropdown Panel
    if (bellNavBtn && notificationDropdown) {
        bellNavBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notificationDropdown.style.display === 'block';
            
            // Close other modals if any
            if(isOpen) {
                notificationDropdown.style.display = 'none';
            } else {
                notificationDropdown.style.display = 'block';
                
                // Mark all notifications as read when opening dropdown!
                const currentNotifications = JSON.parse(localStorage.getItem('active1news_notifications')) || [];
                currentNotifications.forEach(n => n.unread = false);
                localStorage.setItem('active1news_notifications', JSON.stringify(currentNotifications));
                
                // Re-render badge and list
                renderAlertStates();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (notificationDropdown.style.display === 'block') {
                if (!notificationDropdown.contains(e.target) && e.target !== bellNavBtn) {
                    notificationDropdown.style.display = 'none';
                }
            }
        });
    }

    // Dynamic publisher listener: When an article is added to local storage in admin side,
    // the next reload on home automatically registers a new notification trigger alert!
    const activeArticles = JSON.parse(localStorage.getItem('active1news_articles')) || [];
    if (activeArticles.length > 0) {
        const latestArticle = activeArticles[activeArticles.length - 1];
        const lastNotifiedTimestamp = parseFloat(localStorage.getItem('active1news_last_notified_article')) || 0;

        if (latestArticle.timestamp > lastNotifiedTimestamp) {
            // Seed a fresh notification!
            const currentNotifications = JSON.parse(localStorage.getItem('active1news_notifications')) || [];
            currentNotifications.unshift({
                id: Date.now(),
                text: `🆕 New Story Published: "${latestArticle.title}"`,
                timestamp: latestArticle.timestamp,
                unread: true
            });
            
            // Limit alert database to 5 entries to preserve memory
            if (currentNotifications.length > 5) currentNotifications.pop();
            
            localStorage.setItem('active1news_notifications', JSON.stringify(currentNotifications));
            localStorage.setItem('active1news_last_notified_article', latestArticle.timestamp);
            
            // Re-render
            renderAlertStates();
        }
    }

    // === DYNAMIC LIVE TICKER RENDER ===
    function escapeHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderLiveTicker() {
        const tickerContent = document.querySelector('.ticker-content');
        if (!tickerContent) return;

        const defaultTicker = [
            "Global markets surge following tech announcements",
            "Championship finals scheduled for this weekend",
            "New AI models break records in efficiency"
        ];
        
        let tickerItems = JSON.parse(localStorage.getItem('active1news_ticker'));
        if (!tickerItems || !Array.isArray(tickerItems) || tickerItems.length === 0) {
            tickerItems = defaultTicker;
            localStorage.setItem('active1news_ticker', JSON.stringify(defaultTicker));
        }

        tickerContent.innerHTML = tickerItems
            .map(item => `<span>${escapeHTML(item)}</span>`)
            .join('<span class="separator">•</span>');
    }

    renderLiveTicker();
});
