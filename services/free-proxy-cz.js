const cheerio = require('cheerio')
const axios = require('axios')
class FreeProxyCz {

    async _getProxiesList() {
        const url = `http://free-proxy.cz/en/`

        const response = await axios.get(url)

        const {data} = Object.assign({}, response)

        const $ = cheerio.load(data)

        console.log($)

        const proxyListTable = $("#proxy_list > tbody")

        console.log(proxyListTable.length())

    }
}

setImmediate(async () => {
    const freeProxyCz = new FreeProxyCz()

    await freeProxyCz._getProxiesList()
})