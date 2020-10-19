const axios = require('axios')
const cheerio = require('cheerio')
const Promise = require('bluebird')

class FreeProxyListNet {

    async _fetchProxiesList(url) {
        const response = await axios.get(url)

        const {data} = Object.assign({}, response)

        const $ = cheerio.load(data)

        const proxyListTable = $("#proxylisttable")

        const tableContent = proxyListTable.children('tbody')

        const rows = tableContent.children("tr")

        const proxies = []

        for (let i = 1; i <= rows.length; i++) {
            const tr = rows.eq(i)

            const tds = tr.children('td')

            const proxy = `${tds.eq(0).text()}:${tds.eq(1).text()}`
            const country = tds.eq(3).text()
            const anonymity = tds.eq(4).text()
            const type = tds.eq(6) === 'yes' ? 'https': 'http'
            const urlProxy = `${type}://${proxy}`
            const source = url
            proxies.push({proxy, url: urlProxy, country, type, anonymity, source})
        }

        return proxies
    }

    async _getProxiesList() {
        const listUrl = [
            'https://free-proxy-list.net/',
            'https://www.us-proxy.org/',
            'https://free-proxy-list.net/uk-proxy.html',
            'https://www.sslproxies.org/',
            'https://free-proxy-list.net/anonymous-proxy.html',
        ]

        let proxies = []

        const results = await Promise.map(listUrl, async url => {
            return await this._fetchProxiesList(url)
        })

        for (let i = 0; i < results.length; i++) {
            proxies = proxies.concat(results[i])
        }

        return proxies
    }
}

module.exports = FreeProxyListNet

// setImmediate(async () => {
//     const freeProxyListNet = new FreeProxyListNet()
//
//     const proxies = await freeProxyListNet._getProxiesList()
//
//     console.log({proxies})
// })