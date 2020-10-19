const axios = require('axios')
const cheerio = require('cheerio')

class HideMyaMe {

    convert = {
        anonymityLevels: {
            'no': 'transparent',
            'medium': 'anonymous',
            'high': 'elite',
        },
    };

    async _getProxiesList() {
        const url = 'https://hidemyna.me/en/proxy-list'

        const response = await axios.get(url)

        const {data} = Object.assign({}, response)

        const $ = cheerio.load(data)

        const proxyListTable = $("body > div.wrap > div.services_proxylist.services > div > div.table_block > table")

        const tableContent = proxyListTable.children('tbody')

        const rows = tableContent.children('tr')

        const proxies = []

        for (let i = 1; i < rows.length; i++) {
            const tr = rows.eq(i)

            const tds = tr.children('td')


            const speed = tds.eq(3).text()

            const regex = /(.*[0-9])/gm

            const realSpeed = regex.exec(speed)[1]

            if (realSpeed < 700) {
                const proxy = tds.eq(0).text()

                const country = tds.eq(0).text()
                const anonymity = this.convert.anonymityLevels[tds.eq(5).text().trim().toLowerCase()] || null
                const type = tds.eq(4).text().split(',')[0]
                const urlProxy = `${type}://${proxy}`
                const source = url
                proxies.push({proxy, url: urlProxy, country, type, anonymity, source})
            }
        }

        return proxies
    }

}
module.exports = HideMyaMe

setImmediate(async () => {
    const hideMyaMe = new HideMyaMe()

    const proxies = await hideMyaMe._getProxiesList()

    console.log({proxies})
})