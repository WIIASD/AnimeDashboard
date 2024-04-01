async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok.');
        return await response.json();
    } catch (e) {
        console.error('fetch error:', e);
        throw e;
    }
}

class BangumiCollectionItem {
    constructor(name, name_cn, cover, total_ep, watched_ep, subject_id) {
        this.name = name;
        this.name_cn = name_cn;
        this.cover = cover;
        this.total_ep = total_ep;
        this.watched_ep = watched_ep;
        this.subject_id = subject_id;
    }

    renderPanel() {
        return `
            <a href="http://bgm.tv/subject/${this.subject_id}" target="_blank" class="anime-panel-link">
                <div class="anime-panel">
                    <img src="${this.cover}" alt="Anime Title">
                    <div class="anime-info">
                        <h3 title="${this.name_cn}">${this.name_cn}</h3>
                        <h4 title="${this.name}">${this.name}</h4>
                        <p>进度：${this.watched_ep}/${this.total_ep}</p>
                    </div>
                </div>
            </a>
        `
    }
}

class BangumiCollectionDashboard {
    constructor(animes) {
        this.animes = animes;
    }

    renderAnimeDashboard() {
        return `
            <div class="dashboard">
                ${this.animes.map(a => a.renderPanel()).join('\n')}
            </div>
        `
    }
}

class AnimeBlock extends HTMLElement {
    async main(animeBlock, userId) {
        try {
            const offset = 0
            const limit = 10
            const subject_type = 2 //2: anime
            const type = 2 //1: want, 2: watched, 3: watching, 4: ge, 5: abandon
            const result = await fetchData(`https://api.bgm.tv/v0/users/${userId}/collections?subject_type=${subject_type}&type=${type}&limit=${limit}&offset=${offset}`);
            const animes = result["data"].map(a => { 
                const subject = a["subject"]
                return new BangumiCollectionItem(
                    subject["name"],
                    subject["name_cn"],
                    subject["images"]["common"],
                    subject["eps"],
                    a["ep_status"],
                    a.subject_id,
                )
            })
            console.log(result)
            animeBlock.innerHTML = new BangumiCollectionDashboard(animes).renderAnimeDashboard();
        } catch (e) {
            animeBlock.innerHTML = `<p>Error loading content</p>`;
        }
    }

    connectedCallback() {
        const userId = this.getAttribute('data-user-id');
        this.main(this, userId)
    }
}

// Define the new element
customElements.define('anime-block', AnimeBlock);