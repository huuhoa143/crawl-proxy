const axios = require('axios')
const cheerio = require('cheerio')
const Table = require('cli-table3')
const colors = require('colors')
const httpsProxyAgent = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const FreeProxyListNet = require('./services/free-proxy-list-net')
const Promise = require('bluebird')
const checkProxy = require('./checkProxy')
const cliProgress = require('cli-progress')
const _checkProxy = async (proxyAgent) => {
    let url = `https://api.ipify.org/`;

    const start = Date.now()
    const response =  await axios.get(url , {
        httpsAgent: proxyAgent,
        timeout: 1000})

    const end = Date.now() - start
    console.log({end})
    const {data} = Object.assign({}, response)

    return data
}

const _getProxy01 = async () => {
    const url = 'https://free-proxy-list.net/'

    const response = await axios.get(url)

    const {data} = Object.assign({}, response)

    const $ = cheerio.load(data)

    const proxyListTable = $("#proxylisttable")

    const tableContent = proxyListTable.children('tbody')

    const rows = tableContent.children("tr")

    const proxies = []
    for (let i = 0; i < rows.length; i++) {
        const tr = rows.eq(i)
        const tds = tr.children('td')
        const proxy = `${tds.eq(0).text()}:${tds.eq(1).text()}`
        const anonymity = tds.eq(4).text()
        const type = tds.eq(6).text() === 'yes' ? 'https' : 'http'
        proxies.push({proxy, type, anonymity})
    }

    return proxies
}

const _getProxy02 = async () => {
    const url = 'https://spys.one/en/free-proxy-list/'

    const payload = `xx0=96e93de45fe43c5eb7262414692ac971&xpp=5&xf1=0&xf2=0&xf4=0&xf5=1`
    const response = await axios.post(url, payload)

    const {data} = Object.assign({}, response)

    const $ = cheerio.load(data)

    const proxyListTable = $("body > table:nth-child(3) > tbody > tr:nth-child(4) > td > table")

    const tableContent = proxyListTable.children('tbody')

    const rows = tableContent.children("tr")

    const proxies = []
    for (let i = 3; i < rows.length - 1; i++) {
        const tr = rows.eq(i)
        const tds = tr.children('td')
        const proxy = tds.eq(0).text()
        const anonymity = tds.eq(2).text()
        const type = tds.eq(1).text()
        proxies.push({proxy, type, anonymity})
    }

    return proxies
}

setImmediate(async () => {
    // await _getProxy()
    // const proxy = `118.70.116.12:8080`
    // // const proxyAgent = new SocksProxyAgent(`socks4://${proxy}`);
    // //
    // const proxyAgent = new httpsProxyAgent(`http://${proxy}`);
    // //
    // const ip = await _checkProxy(proxyAgent)
    // console.log({ip})
    // const proxies = await _getProxy()
    // console.log({proxies})

    // const proxies = await _getProxy01()
    // console.log(proxies.length)
    // for (let i = 0; i < proxies.length; i++) {
    //     const proxyAgent = new httpsProxyAgent(`http://${proxies[i].proxy}`);
    //     const ip = await _checkProxy(proxyAgent)
    //     console.log({ip:ip, proxy: proxies[i].proxy})
    // }

    const freeProxyListNet = new FreeProxyListNet()

    const url = 'https://ifconfig.me/'

    const proxies = await freeProxyListNet._getProxiesList()

    let goodProxyCount = 0;

    let bar1 = new cliProgress.SingleBar({
        stopOnComplete: true,
        format: '{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Good: {goodProxyCount}'
    }, cliProgress.Presets.shades_classic)

    bar1.start(proxies.length, 0, { goodProxyCount })


    let proxiesCheck = []
    for (let i = 0; i < proxies.length; i++) {
        proxiesCheck.push(checkProxy(url, proxies[i].proxy, {
            protocol: 'http',
            timeout: 10
        }))
    }

    const results = await Promise.map(proxiesCheck, result => {
        goodProxyCount += result.success ? 1 : 0
        bar1.increment({ goodProxyCount })
        return result
    })

    let table = new Table({style: {head: ['cyan']}, head: [
            'Proxy', 'Result', 'Time', 'Response'
        ]});

    results.map((item) => {
        table.push([
            item.name,
            item.success ? colors.green('TRUE') : colors.red('FALSE'),
            item.time,
            item.success ? item.response : colors.red(item.error)
        ]);
    })

    let good = results.reduce((a,c) => a + (c.success ? 1 : 0), 0)

    console.log(table.toString())

    console.log(good)

})