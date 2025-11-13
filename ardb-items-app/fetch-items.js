const https = require('https');
const fs = require('fs');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Загрузка списка предметов...');
    const itemsList = JSON.parse(fs.readFileSync('items_list.json', 'utf8'));

    console.log(`Найдено ${itemsList.length} предметов`);
    console.log('Начинаем загрузку данных...');

    const items = [];
    let completed = 0;

    for (const file of itemsList) {
        if (file.type === 'file' && file.name.endsWith('.json')) {
            try {
                const itemData = await fetchJSON(file.download_url);
                items.push(itemData);
                completed++;

                if (completed % 50 === 0) {
                    console.log(`Загружено ${completed}/${itemsList.length} предметов...`);
                }

                // Небольшая задержка, чтобы не перегружать API
                await delay(100);
            } catch (error) {
                console.error(`Ошибка загрузки ${file.name}:`, error.message);
            }
        }
    }

    console.log(`\nВсего загружено: ${items.length} предметов`);
    console.log('Сохранение данных в items.json...');

    fs.writeFileSync('items.json', JSON.stringify(items, null, 2));
    console.log('Готово! Данные сохранены в items.json');
}

main().catch(console.error);
