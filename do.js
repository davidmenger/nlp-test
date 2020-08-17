
const fs = require('fs');
const path = require('path');
const req = require('request-promise-native');

const API = 'https://model.wingbot.ai';
const MODEL = '';

function intentNameFilter (intentName) {
    const match = `${intentName}`.match(/^q-(.+)-[a-zA-Z0-9]{4,7}$/);
    if (match) {
        return match[1];
    }
    return intentName;
}


async function fn () {
    const data = fs.readFileSync(path.join(__dirname, 'in.csv'), { encoding: 'utf8' });
    const out = [];
    const out2 = [];

    let min = Number.MAX_SAFE_INTEGER;
    let max = 0;
    let sum = 0;
    let cnt = 0;

    process.stdout.write('\n');
    for (const text of data.split('\n')) {
        // const [text] = line.split(/[,;]/);

        const start = Date.now();

        const res = await req({
            url: `${API}/${MODEL}`,
            json: true,
            qs: { text }
        })

        const stop = Date.now() - start;

        if (max < stop) max = stop;
        if (min > stop) min = stop;
        cnt++;
        sum += stop;

        const { tags = [] } = res;
        const { intent = '-', score = 0, entities = [] } = tags[0] || {};

        const [{ entity, value } = { entity: '', value: '' }] = entities;

        process.stdout.write(".");

        out.push(`${text}\t${intentNameFilter(intent)}\t${(score + '').replace('.', ',')}\t${entity}\t${value}`);
        out2.push(`${text} (${intent}, ${score})\tpromluva\n\t\t\t"${text}"\t"-"\t"nothing"`);
    }

    console.log(`\nmin: ${min}\nmax: ${max}\navg: ${sum / cnt}`);

    fs.writeFileSync(path.join(__dirname, 'out.csv'), out.join('\n'));
    fs.writeFileSync(path.join(__dirname, 'out2.csv'), out2.join('\n'));

}

fn().catch(e => console.error(e));