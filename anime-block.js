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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class BangumiCollectionItem {

    constructor(bangumiCollectionData, showProgress) {
        const subject = bangumiCollectionData["subject"]
        this.name = subject["name"];
        this.name_cn = subject["name_cn"];
        this.cover = subject["images"]["common"];
        this.total_ep = subject["eps"];
        this.watched_ep = bangumiCollectionData["ep_status"];
        this.subject_id = subject["id"];
        this.showProgress = showProgress;
    }

    renderPanel() {
        const title = `<anime-title title="${this.name_cn}">${this.name_cn}</anime-title>`
        const subtitle = `<anime-subtitle title="${this.name}">${this.name}</anime-subtitle>`
        const animeProgress = this.showProgress ? `<anime-progress>进度：${this.watched_ep}/${this.total_ep}</anime-progress>` : "";
        return `
            <a href="http://bgm.tv/subject/${this.subject_id}" target="_blank" class="anime-panel-link">
                <div class="anime-panel">
                    <img src="${this.cover}" alt="Anime Title">
                    <div class="anime-info-block">
                        ${title}
                        ${subtitle}
                        ${animeProgress}
                    </div>
                </div>
            </a>
        `
    }
}

class BangumiCollectionDashboard {

    static collectionType = {
        wish: 1,
        watched: 2,
        watching: 3,
        left: 4,
        abandon: 5
    }

    constructor(userId, type, limit = 10) {
        this.userId = userId;
        this.type = BangumiCollectionDashboard.collectionType[type];
        this.limit = limit;
        this.offset = 0;
        this.animes = [];
        this.total = 0;
    }

    async init() { 
        await this.fetchAnimes(); //load first page of data.
    }

    async fetchAnimes() {
        const subject_type = 2 //2: anime
        const result = await fetchData(`https://api.bgm.tv/v0/users/${this.userId}/collections?subject_type=${subject_type}&type=${this.type}&limit=${this.limit}&offset=${this.offset}`);
        
        console.log(result)

        const animes = result["data"].map(a => new BangumiCollectionItem(
            a,
            this.type == BangumiCollectionDashboard.collectionType.watching
        ))

        this.total = result["total"];
        this.animes = this.animes.concat(animes)
    }

    haveMore() {
        return this.offset < this.total;
    }

    async loadMore() {
        this.offset += this.limit;
        if (!this.haveMore()) {
            alert("no more data to load!");
            return;
        }
        await this.fetchAnimes();
    }

    renderAnimeDashboard() {
        const dashboardDiv = document.createElement('div');
        dashboardDiv.className = 'dashboard';
        dashboardDiv.innerHTML = this.animes.map(a => a.renderPanel()).join('\n')
        return dashboardDiv
    }
}

class AnimeBlock extends HTMLElement {
    constructor() {
        super();
        this.dashboard = null;
    }

    render () {
        this.innerHTML = ""; // Clear the existing content.
        this.appendChild(this.dashboard.renderAnimeDashboard());
        if (this.dashboard.haveMore()) {
            const button = this.createLoadMoreButton();
            this.appendChild(button);
        }
    }

    async main(userId, collectionType) {
        try {
            this.dashboard = new BangumiCollectionDashboard(userId, collectionType, 8)
            await this.dashboard.init();
            this.render();
        } catch (e) {
            this.innerHTML = `<p>Error loading content: ${e}</p>`;
            console.error(e.stack);
        }
    }

    connectedCallback() {
        const userId = this.getAttribute('data-user-id');
        const collectionType = this.getAttribute("data-collection-type")
        this.main(userId, collectionType)
    }

    createLoadMoreButton() {
        // Create a container for the button to assist with centering
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.marginTop = '16px'; // Add some space above the button

        const loadMoreButton = document.createElement('button');
        loadMoreButton.innerText = 'Load More';
        loadMoreButton.className = 'load-more'; // Add the class for styling
        loadMoreButton.addEventListener('click', async () => {
            loadMoreButton.disabled = true;
            await this.dashboard.loadMore();
            loadMoreButton.disabled = false;
            this.render(); // Re-render the dashboard with the new items
        });
        
        // Append the button to the container, and the container to the component
        buttonContainer.appendChild(loadMoreButton);
        return buttonContainer
    }
}

// Define the new element
customElements.define('anime-block', AnimeBlock);