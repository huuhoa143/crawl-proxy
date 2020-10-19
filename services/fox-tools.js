const axios = require('axios')
const Promise = require('bluebird')

class FoxTools {

    async _getTotalPage() {
        const url = `http://api.foxtools.ru/v2/Proxy.json?page=1`

        const response = await axios.get(url)

        const {data} = Object.assign({}, response)

        const {response: resData} = Object.assign({}, data)

        const {pageCount} = Object.assign({}, resData)

        return pageCount
    }

    async _fetchProxiesList(page) {
        const url = `http://api.foxtools.ru/v2/Proxy.json?page=${page}`

        const response = await axios.get(url)

        const {data} = Object.assign({}, response)

        const {response: resData} = Object.assign({}, data)

        const {pageCount, items} = Object.assign({}, resData)


        this.numberPage = pageCount

        return await Promise.map(items, item => {
            const proxy = `${item.ip}:${item.port}`
            let typeProxy = ''
            if (item.type === 1) {
                typeProxy = 'http'
            }

            if (item.type === 2) {
                typeProxy = 'https'
            }

            if (item.type === 4) {
                typeProxy = 'sock4'
            }

            if (item.type === 5) {
                typeProxy = 'sock5'
            }

            const url = typeProxy ? `${typeProxy}://${proxy}` : `http://${proxy}`

            const country = item.country.nameEn
            const anonymity = item.anonymity
            return {
                proxy: proxy,
                url: url,
                country: country,
                type: typeProxy,
                anonymity: anonymity,
                source: 'http://api.foxtools.ru/'
            }
        })
    }

    async _getProxiesList() {
        const pageNumber = await this._getTotalPage()

        let tmpArray = []

        for (let i = 1; i <= pageNumber; i++) {
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

module.exports = FoxTools

setImmediate(async () => {
    const foxTools = new FoxTools()
    const proxies = await foxTools._getProxiesList()
    console.log(proxies)
})