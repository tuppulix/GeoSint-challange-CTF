'use strict';

lucide.createIcons();

const capitalize = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

async function fetchInfo() {
    const response = await fetch('/info.json');
    if (!response.ok) {
        throw new Error('info.json missing');
    }
    return response.json();
}

async function setCards() {
    let data;
    try {
        data = await fetchInfo();
    } catch (error) {
        console.error('Failed to load info.json', error);
        return;
    }

    const competitionsRoot = document.getElementById('competitions');
    if (!competitionsRoot) {
        return;
    }
    competitionsRoot.innerHTML = '';

    Object.entries(data).forEach(([competition, challenges], index) => {
        const section = document.createElement('section');
        section.className = 'chall-section';
        section.style.animationDelay = `${index * 0.1}s`;

        const sectionTitle = document.createElement('h4');
        sectionTitle.className = 'chall-section-title';
        sectionTitle.innerHTML = `<i data-lucide="folder-open" size="18"></i> ${capitalize(competition)} `;
        section.appendChild(sectionTitle);

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-grid';

        Object.entries(challenges).forEach(([challengeName, details]) => {
            const card = document.createElement('div');
            card.className = 'chall-card';
            card.role = 'button';
            card.tabIndex = 0;

            if (details.img) {
                card.style.setProperty('--bg-img', `url('/img/${competition}/${challengeName}/${details.img}')`);
            }

            const icon = document.createElement('div');
            icon.className = 'card-icon';
            icon.innerHTML = '<i data-lucide="arrow-up-right" size="16"></i>';
            card.appendChild(icon);

            const content = document.createElement('div');
            content.className = 'card-content';

            const cardTitle = document.createElement('div');
            cardTitle.className = 'card-title';
            cardTitle.textContent = capitalize(challengeName);

            content.appendChild(cardTitle);
            card.appendChild(content);

            const openChallenge = () => {
                window.location.href = `/${competition}-${challengeName}`;
            };

            card.addEventListener('click', openChallenge);
            

            cardsContainer.appendChild(card);
        });

        section.appendChild(cardsContainer);
        competitionsRoot.appendChild(section);
    });

    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', setCards);
