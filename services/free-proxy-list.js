const axios = require('axios')
const cheerio = require('cheerio')
const Promise = require('bluebird')

class FreeProxyList {
    constructor() {
        this.storage = []
    }

    async _fetchProxiesList(page) {
        const url = `https://www.free-proxy-list.com/?search=1&page=${page}&port=&type%5B%5D=http&type%5B%5D=https&speed%5B%5D=2&speed%5B%5D=3&connect_time%5B%5D=2&connect_time%5B%5D=3&up_time=0`

        const response = await axios.get(url)

        const {data} = Object.assign({}, response)

        const $ = cheerio.load(data)

        const proxyListTable = $("div.container > div.content-wrapper > div.section > div.table-responsive > table > tbody > tr")

        const proxies = []

        proxyListTable.each((index, item) => {
            const children = $(item).find('td:not(.report-cell)')
            const proxy = `${children.eq(0).text()}:${children.eq(1).text()}`
            const country = children.eq(2).text().replace(/[\t\n]/g, '')
            const type = children.eq(7).text()
            const anonymity = children.eq(8).text()
            const url = `${type}://${proxy}`
            proxies.push({proxy, url, country, type, anonymity, source: 'free-proxy-list.com'})
        })

        return proxies

    }

    async _getProxiesList() {
        const url = `https://www.free-proxy-list.com/?search=1&page=1&port=&type%5B%5D=http&type%5B%5D=https&speed%5B%5D=2&speed%5B%5D=3&connect_time%5B%5D=2&connect_time%5B%5D=3&up_time=0`

        const response = await axios.get(url)

        const {data} = Object.assign({}, response)

        const $ = cheerio.load(data)

        const pageRaw = $("body > div.wrapper > div.container > div > div > div.content-list-pager-wrapper > ul > li")

        let tmpArray = []
        for (let i = 1; i <= pageRaw.length - 4; i++) {
            tmpArray.push(this._fetchProxiesList(i))
        }

        let proxies = []
        const results = await Promise.map(tmpArray, result => {
            return result
        })

        for (let i = 0; i < results.length; i++) {
            proxies = proxies.concat(results[i])
        }

        return proxies
    }
}

module.exports = FreeProxyList

setImmediate(async () => {
    const freeProxyList = new FreeProxyList()
    const proxies = await freeProxyList._getProxiesList()
    console.log({proxies})
})