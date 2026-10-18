import { createStore } from 'vuex'

import LZString from 'lz-string'

/******************************************************************************/
const pascal = function(n) {
    var add = 1, init = 0
    for (var i = 0; i < n; i++) { init += add; add += 1; }
    return init
}
/*----------------------------------------------------------------------------*/
const fibonacci = function(n) {
    var a = 0, b = 1, f = 1
    for (var i = 2; i <= n; i++) { f = a + b; a = b; b = f; }
    return f
}
/*----------------------------------------------------------------------------*/
const threat = function(stats) {

    var threshholds = [320, 800, 1440, 2240, 3200, 4320, 5600, 7040, 8640, 10400, 12320, 14400]
    var level = 0
    for (let i = 0; i < threshholds.length; i++) {
        if (stats.power * stats.speed >= threshholds[i]) level += 1
        else continue
    }
    return Math.min(11, level)
}
/******************************************************************************/

export const store = createStore({
    state() {
        return {
        
            /*----------------------------------------------------------------*/
            data: {},
            version: '1.0',
            /*----------------------------------------------------------------*/
            stars: [],
            ships: [],
            resources: [],
            producers: [],
            achievements: [],
            storageUpgrades: [],
            /*----------------------------------------------------------------*/
            machineT1: [],
            machineT2: [],
            machineT3: [],
            machineT4: [],
            machineT5: [],
            machineT6: [],
            /*----------------------------------------------------------------*/
            resAchievements: [],
            prodAchievements: [],
            /*----------------------------------------------------------------*/
            storagePrice: 1,
            storageExcess: 1,
            titanSwapingCount: 0,
            speedFactor: 2,
            /*----------------------------------------------------------------*/
            lastUpdateTime: new Date().getTime(),
            /*----------------------------------------------------------------*/
            rank: { level:1, xpNeeded:0, xpLeft:0, percent:0, current:0 },
            /*----------------------------------------------------------------*/
            autoSaveInterval: 30 * 1000,
            timeSinceAutoSave: 0,
            /*----------------------------------------------------------------*/
            locale: 'en',
            activePane: 'metalPane',
            companyName: 'NG Space',
            notifications: [],
            newAchievement: false,
            notifAutoSave: true,
            notifAchievement: true,
            displayLockedItems: false,
            displayPinnedItems: false,
            displayDoneTechs: true,
            displayRoadmap: true,
            displayEmcShortcut: false,
            collapsed: [],
            pinned: [],
            /*----------------------------------------------------------------*/
            fleet: { power:0, defense:0, speed:0 },
            activeFleet: { power:0, defense:0, speed:0 },
            /*----------------------------------------------------------------*/
            username: null,
            token: null,
            /*----------------------------------------------------------------*/
            emcAmount: 'max',
            autoResource: null,
            autoEmcInterval: 1 * 1000,
            timeSinceAutoEmc: 0,
            /*----------------------------------------------------------------*/
            stats: {
                startDate: new Date().getTime(),
                lastEnlightenDate: new Date().getTime(),
                enlightenCount: 0,
                allTimeUltrite: 0,
                lastRebirthDate: new Date().getTime(),
                rebirthCount : 0,
                allTimeDarkmatter: 0,
                manualGain: { current:0, allTime:0 },
                machineT1: { current:0, allTime:0 },
                machineT2: { current:0, allTime:0 },
                machineT3: { current:0, allTime:0 },
                machineT4: { current:0, allTime:0 },
                machineT5: { current:0, allTime:0 },
                machineT6: { current:0, allTime:0 },
                ships: { current:0, allTime:0 },
                starOwned: { current:0, allTime:0 },
            },
            /*----------------------------------------------------------------*/
            context: {
                count: {},
            },
            /*----------------------------------------------------------------*/
        }
    },
    getters: {
    
        /*--------------------------------------------------------------------*/
        isNotif: (state) => (id) => { return state.notifications.includes(id) },
        /*--------------------------------------------------------------------*/
        hasNotif: (state) => {
        
            if (state.notifications.length > 0 && !state.notifications.includes('achievementPane')) return true
            return false
        },
        /*--------------------------------------------------------------------*/
        isCollapsed: (state) => (id) => { return state.collapsed.includes(id) },
        isPinned: (state) => (id) => {
            
            let result = false
            state.pinned.forEach(pane => {
                if (pane.id == id) {
                    result = true
                    return
                }
            })
            
            return result
        },
        /*--------------------------------------------------------------------*/
        getThreat: (state) => (id) => {
            
            let item = state.data[id]
            return threat(item.stats)
        },
        /*--------------------------------------------------------------------*/
        getSpyChance: (state) => (id) => {
            
            let item = state.data[id]
            let t = threat(item.stats)
            return Math.min(100, state.data['shipT1'].active / (t + 1) * (20 / (item.spy + 1)))
        },
        /*--------------------------------------------------------------------*/
        getFactionMultiplier: (state) => (id) => {
        
            var op = state.data[id].opinion
            if (op >= 20) return 0.5
            else if (op >= -20 && op < 20) return 1
            else if (op >= -60 && op < -20) return 2
            else if (op < -60) return 3
            else return 0
        },
        /*--------------------------------------------------------------------*/
        getInvadeChance: (state, getters) => (id) => {
            
            let activeFleet = state.activeFleet
            if (activeFleet.power != 0) {
            
                let star = state.data[id]
                
                let multi = getters.getFactionMultiplier(star.faction)
                if (multi == 0) return 'peace'

                let damage = (activeFleet.power / star.stats.defense * multi) * activeFleet.speed
                let starDamage = (star.stats.power * multi / Math.max(activeFleet.defense, 1)) * star.stats.speed
                if (damage > starDamage) return (damage / starDamage) - 0.5
                else if (damage != 0) return Math.max(0, 1.5 - (starDamage / damage))
            }
            
            return 0
        },
        /*--------------------------------------------------------------------*/
        getDMWonders: (state) => {
        
            var dm = 0
            if (state.data['wonderPrecious1'].count > 0 && state.data['wonderEnergetic1'].count > 0 && state.data['wonderTechnological1'].count > 0 && state.data['wonderMeteorite1'].count > 0) dm += 3
            if (state.data['wonderComm'].count > 0 && state.data['wonderSpaceship'].count > 0 && state.data['wonderAntimatter'].count > 0 && state.data['wonderPortal'].count > 0) dm += 4
            if (state.data['wonderStargate'].count > 0) dm += 2
            return dm
        },
        /*--------------------------------------------------------------------*/
        getDMSpheres: (state) => {
        
            var dm = 0
            var sphere = state.data['dysonT3']
            if (sphere.count != 0) dm += 10
            dm += sphere.count * 5
            return dm
        },
        /*--------------------------------------------------------------------*/
        getDMResearches: (state) => {
        
            return Math.floor((state.data['boostProduction'].count + state.data['boostEnergy'].count + state.data['boostScience'].count + state.data['boostEnergyStorage'].count) / 25) * 2
        },
        /*--------------------------------------------------------------------*/
        getDMRank: (state) => {
        
            return state.rank.level * 2
        },
        /*--------------------------------------------------------------------*/
        getDMSwarms: (state) => {
        
            return Math.floor(Math.pow(2 * state.data['dysonT2'].count + 0.25, 0.5) - 0.5)
        },
        /*--------------------------------------------------------------------*/
        getPotentialDM: (state, getters) => {
        
            return getters.getDMWonders + getters.getDMSpheres + getters.getDMResearches + getters.getDMRank + getters.getDMSwarms
        },
        /*--------------------------------------------------------------------*/
        getStarPower: (state, getters) => (id) => {
        
            var star = state.data[id]
            if (star.spy <= 0) return '???'
            
            var multi = getters.getFactionMultiplier(star.faction)
            var val = Math.floor(star.stats.power * multi).toString()
            var unknown = ''
            for (var i = 0; i < val.length - (star.spy - 1); i++) { unknown += '?' }
            return val.substring(0, star.spy - 1) + unknown
        },
        /*--------------------------------------------------------------------*/
        getStarDefense: (state, getters) => (id) => {
        
            var star = state.data[id]
            if (star.spy <= 0) return '???'
            
            var multi = getters.getFactionMultiplier(star.faction)
            var val = Math.floor(star.stats.defense * multi).toString()
            var unknown = ''
            for (var i = 0; i < val.length - (star.spy - 1); i++) { unknown += '?' }
            return val.substring(0, star.spy - 1) + unknown
        },
        /*--------------------------------------------------------------------*/
        getStarSpeed: (state) => (id) => {
        
            var star = state.data[id]
            if (star.spy <= 0) return '???'
            
            var val = Math.floor(star.stats.speed).toString()
            var unknown = ''
            for (var i = 0; i < val.length - (star.spy - 1); i++) { unknown += '?' }
            return val.substring(0, star.spy - 1) + unknown
        },
        /*--------------------------------------------------------------------*/
        getULStars: (state) => {
        
            let ownedStarCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.status == 'owned') ownedStarCount += 1
                if (star.subStatus == 'terraformed' || star.subStatus == 'statued') ownedStarCount += 5
            }
            
            return ownedStarCount
        },
        /*--------------------------------------------------------------------*/
        getULDarkmatter: (state, getters) => {
        
            return Math.floor((state.data['darkmatter'].count + getters.getPotentialDM) / 10)
        },
        /*--------------------------------------------------------------------*/
        getULStatues: (state) => {
        
            let ul = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.subStatus == 'statued') ul += 5
            }
            
            return ul
        },
        /*--------------------------------------------------------------------*/
        getPotentialUL: (state, getters) => {
        
            return getters.getULStars + getters.getULDarkmatter + getters.getULStatues
        },
        /*--------------------------------------------------------------------*/
        canBuild: (state) => (id) => {
        
            let canBuild = true
            let item = state.data[id]
            
            if ('max' in item && item.count >= item.max) canBuild = false

            if ('costs' in item) {
                item['costs'].forEach(cost => {
                    if (state.data[cost.id].count - cost.count < 0) {
                        canBuild = false
                        return
                    }
                })
            }
            
            return canBuild
        },
        /*--------------------------------------------------------------------*/
        getStorageCap: (state) => (id) => {
            
            let item = state.data[id]
            return item.storage * state.storageExcess
        },
        /*--------------------------------------------------------------------*/
        getStatuesCount(state) {
        
            let statuesCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.subStatus == 'statued') statuesCount += 1
            }
            return statuesCount
        },
        /*--------------------------------------------------------------------*/
        getCurrentTitan(state) {

            let list = []
            state.resources.forEach(item => { if (item.titan == true) list.push(item.id) })
            return list
        },
        /*--------------------------------------------------------------------*/
        getNotCurrentTitan(state) {

            let list = []
            state.resources.forEach(item => { if (item.titan == false) list.push(item.id) })
            return list
        },
        /*--------------------------------------------------------------------*/
        getOwnedStarCount(state) {
        
            let ownedStarCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.status == 'owned') ownedStarCount += 1
            }
            return ownedStarCount
        },
        /*--------------------------------------------------------------------*/
        getCtxCount: (state) => (id) => { return state.context.count[id] },
        /*--------------------------------------------------------------------*/
    },
    mutations: {
    
        /*--------------------------------------------------------------------*/
        setLocale(state, payload) { state.locale = payload },
        setCompanyName(state, payload) { state.companyName = payload },
        setAutoSaveInterval(state, payload) { state.autoSaveInterval = payload * 1000 },
        setSpeedFactor(state, payload) { state.speedFactor = payload },
        setNotifAutoSave(state, payload) { state.notifAutoSave = payload },
        setNotifAchievement(state, payload) { state.notifAchievement = payload },
        setDisplayLockedItems(state, payload) { state.displayLockedItems = payload },
        setDisplayPinnedItems(state, payload) { state.displayPinnedItems = payload },
        setDisplayDoneTechs(state, payload) { state.displayDoneTechs = payload },
        setDisplayRoadmap(state, payload) { state.displayRoadmap = payload },
        setAutoStorageUpgrade(state, payload) { state.data[payload.id].auto = payload.auto },
        setUsername(state, payload) { state.username = payload },
        setToken(state, payload) { state.token = payload },
        setEmcAmount(state, payload) { state.emcAmount = payload },
        setAutoResource(state, payload) { state.autoResource = payload },
        setAutoEmcInterval(state, payload) { state.autoEmcInterval = payload * 1000 },
        setDisplayEmcShortcut(state, payload) { state.displayEmcShortcut = payload },
        /*--------------------------------------------------------------------*/
        setActivePane(state, payload) {

            state.activePane = payload
            
            let index = state.notifications.indexOf(payload)
            if (index > -1) state.notifications.splice(index, 1)
        },
        /*--------------------------------------------------------------------*/
        setLastUpdateTime(state, payload) { state.lastUpdateTime = payload },
        setTimeSinceAutoSave(state, payload) { state.timeSinceAutoSave = payload },
        setTimeSinceAutoEmc(state, payload) { state.timeSinceAutoEmc = payload },
        /*--------------------------------------------------------------------*/
        addNotif(state, payload) { if (!(state.notifications.includes(payload) || state.activePane === payload)) state.notifications.push(payload) },
        /*--------------------------------------------------------------------*/
        setDataProd(state, payload) { if (payload.prod  != state.data[payload.id].prod) state.data[payload.id].prod  = payload.prod },
        setDataBoost(state, payload) { if (payload.boost  != state.data[payload.id].boost) state.data[payload.id].boost = payload.boost },
        setDataCount(state, payload) { if (payload.count != state.data[payload.id].count) state.data[payload.id].count = payload.count },
        setDataProduction(state, payload) { if (payload.production  != state.data[payload.id].production) state.data[payload.id].production = payload.production },
        setDataConsumption(state, payload) { if (payload.consumption != state.data[payload.id].consumption) state.data[payload.id].consumption = payload.consumption },
        /*--------------------------------------------------------------------*/
        computeStorage(state, id) {
            
            let item = state.data[id]
            item.storage = item.baseStorage
            
            for (let i in state.data) {
                let building = state.data[i]
                if ('storage' in building && building.storage.id == id && building.count > 0) {
                
                    if (building.storage.type == 'DOUBLE') item.storage = item.baseStorage * Math.pow(2, building.count)
                    else if (building.storage.type == 'FIXED') {
                        
                        if (building.storage.id == 'energy') item.storage += (building.storage.count * building.count) * (1 + (0.01 * state.data['boostEnergyStorage'].count))
                        else item.storage += building.storage.count * building.count
                    }
                }
            }
        },
        /*--------------------------------------------------------------------*/
        computeCosts(state, id) {
            
            let item = state.data[id]
            item.costs = JSON.parse(JSON.stringify(item.baseCosts))
            
            item.costs.forEach(cost => {
                if (item.costType == 'EXPONENTIAL') cost.count = Math.floor(cost.count * Math.pow(1.1, item.count))
                else if (item.costType == 'DYSON') cost.count = Math.floor(cost.count * Math.pow(1.02, item.count))
                else if (item.costType == 'DOUBLE') cost.count = cost.count * Math.pow(2.0, item.count) * state.storagePrice
                
                if (state.data[cost.id].titan == true) cost.count *= 0.1
            })
            
            if (item.probeBaseCosts) {
                item.probeCosts = JSON.parse(JSON.stringify(item.probeBaseCosts))
                item.probeCosts.forEach(cost => {
                    if (state.data[cost.id].titan == true) cost.count *= 0.1
                })
            }
            
            if (item.terraformBaseCosts) {
                item.terraformCosts = JSON.parse(JSON.stringify(item.terraformBaseCosts))
                item.terraformCosts.forEach(cost => {
                    if (state.data[cost.id].titan == true) cost.count *= 0.1
                })
            }
            
            if (item.statueBaseCosts) {
                item.statueCosts = JSON.parse(JSON.stringify(item.statueBaseCosts))
                item.statueCosts.forEach(cost => {
                    if (state.data[cost.id].titan == true) cost.count *= 0.1
                })
            }
        },
        /*--------------------------------------------------------------------*/
        computeFleetStats(state) {
            
            let total = 0, activeTotal = 0
            
            let stats = { power:0, defense:0, speed:0 }
            let activeStats = { power:0, defense:0, speed:0 }
            
            for (let i in state.ships) {
            
                var item = state.ships[i]
                
                stats.power += item.stats.power * item.count
                stats.defense += item.stats.defense * item.count
                stats.speed += item.stats.speed * item.count
                total += item.count

                activeStats.power += item.stats.power * item.active
                activeStats.defense += item.stats.defense * item.active
                activeStats.speed += item.stats.speed * item.active
                activeTotal += item.active
            }
            
            stats.speed = Math.floor(stats.speed / total)
            state.fleet = JSON.parse(JSON.stringify(stats))
            
            activeStats.speed = Math.floor(activeStats.speed / activeTotal)
            state.activeFleet = JSON.parse(JSON.stringify(activeStats))
        },
        /*--------------------------------------------------------------------*/
        toggleCollapsed(state, id) {
            
            let index = state.collapsed.indexOf(id)
            if (index >= 0) state.collapsed.splice(index, 1)
            else state.collapsed.push(id)
        },
        /*--------------------------------------------------------------------*/
        togglePinned(state, payload) {
            
            let found = false
            let index = -1
            state.pinned.forEach(pane => {
                index += 1
                if (pane.id == payload.id) {
                    state.pinned.splice(index, 1)
                    found = true
                }
            })
            
            if (found == false) state.pinned.push(payload)
        },
        /*--------------------------------------------------------------------*/
    },
    actions: {
    
        // STARTING
        /*--------------------------------------------------------------------*/
        initialize({ state }) {
            
            // RESOURCE ACHIEVEMENTS
            /*----------------------------------------------------------------*/
            state.data['achMeteorite'] = { id:'achMeteorite', icon:'meteorite.png', data:'meteorite', unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achCarbon'] =    { id:'achCarbon',    icon:'carbon.png',    data:'carbon',    unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achOil'] =       { id:'achOil',       icon:'oil.png',       data:'oil',       unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achMetal'] =     { id:'achMetal',     icon:'metal.png',     data:'metal',     unlocked:true,  count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achGem'] =       { id:'achGem',       icon:'gem.png',       data:'gem',       unlocked:true,  count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achWood'] =      { id:'achWood',      icon:'wood.png',      data:'wood',      unlocked:true,  count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achSilicon'] =   { id:'achSilicon',   icon:'silicon.png',   data:'silicon',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achUranium'] =   { id:'achUranium',   icon:'uranium.png',   data:'uranium',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achLava'] =      { id:'achLava',      icon:'lava.png',      data:'lava',      unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achLunarite'] =  { id:'achLunarite',  icon:'lunarite.png',  data:'lunarite',  unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achMethane'] =   { id:'achMethane',   icon:'methane.png',   data:'methane',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achTitanium'] =  { id:'achTitanium',  icon:'titanium.png',  data:'titanium',  unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achGold'] =      { id:'achGold',      icon:'gold.png',      data:'gold',      unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achSilver'] =    { id:'achSilver',    icon:'silver.png',    data:'silver',    unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achHydrogen'] =  { id:'achHydrogen',  icon:'hydrogen.png',  data:'hydrogen',  unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achHelium'] =    { id:'achHelium',    icon:'helium.png',    data:'helium',    unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achIce'] =       { id:'achIce',       icon:'ice.png',       data:'ice',       unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achScience'] =   { id:'achScience',   icon:'science.png',   data:'science',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            state.data['achFuel'] =      { id:'achFuel',      icon:'fuel.png',      data:'fuel',      unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 500000000000] }
            /*----------------------------------------------------------------*/
            
            // PRODUCER ACHIEVEMENTS
            /*----------------------------------------------------------------*/
            state.data['achEnergyT1'] =    { id:'achEnergyT1',    icon:'energy.png',    data:'energyT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT2'] =    { id:'achEnergyT2',    icon:'energy.png',    data:'energyT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT3'] =    { id:'achEnergyT3',    icon:'energy.png',    data:'energyT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT4'] =    { id:'achEnergyT4',    icon:'energy.png',    data:'energyT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT5'] =    { id:'achEnergyT5',    icon:'energy.png',    data:'energyT5',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT6'] =    { id:'achEnergyT6',    icon:'energy.png',    data:'energyT6',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT1'] =    { id:'achPlasmaT1',    icon:'plasma.png',    data:'plasmaT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT2'] =    { id:'achPlasmaT2',    icon:'plasma.png',    data:'plasmaT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT3'] =    { id:'achPlasmaT3',    icon:'plasma.png',    data:'plasmaT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT4'] =    { id:'achPlasmaT4',    icon:'plasma.png',    data:'plasmaT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT1'] = { id:'achMeteoriteT1', icon:'meteorite.png', data:'meteoriteT1', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT2'] = { id:'achMeteoriteT2', icon:'meteorite.png', data:'meteoriteT2', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT3'] = { id:'achMeteoriteT3', icon:'meteorite.png', data:'meteoriteT3', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT4'] = { id:'achMeteoriteT4', icon:'meteorite.png', data:'meteoriteT4', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT1'] =    { id:'achCarbonT1',    icon:'carbon.png',    data:'carbonT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT2'] =    { id:'achCarbonT2',    icon:'carbon.png',    data:'carbonT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT3'] =    { id:'achCarbonT3',    icon:'carbon.png',    data:'carbonT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT4'] =    { id:'achCarbonT4',    icon:'carbon.png',    data:'carbonT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT5'] =    { id:'achCarbonT5',    icon:'carbon.png',    data:'carbonT5',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT1'] =       { id:'achOilT1',       icon:'oil.png',       data:'oilT1',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT2'] =       { id:'achOilT2',       icon:'oil.png',       data:'oilT2',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT3'] =       { id:'achOilT3',       icon:'oil.png',       data:'oilT3',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT4'] =       { id:'achOilT4',       icon:'oil.png',       data:'oilT4',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT5'] =       { id:'achOilT5',       icon:'oil.png',       data:'oilT5',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT1'] =     { id:'achMetalT1',     icon:'metal.png',     data:'metalT1',     unlocked:true,  count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT2'] =     { id:'achMetalT2',     icon:'metal.png',     data:'metalT2',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT3'] =     { id:'achMetalT3',     icon:'metal.png',     data:'metalT3',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT4'] =     { id:'achMetalT4',     icon:'metal.png',     data:'metalT4',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT5'] =     { id:'achMetalT5',     icon:'metal.png',     data:'metalT5',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT1'] =       { id:'achGemT1',       icon:'gem.png',       data:'gemT1',       unlocked:true,  count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT2'] =       { id:'achGemT2',       icon:'gem.png',       data:'gemT2',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT3'] =       { id:'achGemT3',       icon:'gem.png',       data:'gemT3',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT4'] =       { id:'achGemT4',       icon:'gem.png',       data:'gemT4',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT5'] =       { id:'achGemT5',       icon:'gem.png',       data:'gemT5',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT1'] =      { id:'achWoodT1',      icon:'wood.png',      data:'woodT1',      unlocked:true,  count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT2'] =      { id:'achWoodT2',      icon:'wood.png',      data:'woodT2',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT3'] =      { id:'achWoodT3',      icon:'wood.png',      data:'woodT3',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT4'] =      { id:'achWoodT4',      icon:'wood.png',      data:'woodT4',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT5'] =      { id:'achWoodT5',      icon:'wood.png',      data:'woodT5',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT1'] =   { id:'achSiliconT1',   icon:'silicon.png',   data:'siliconT1',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT2'] =   { id:'achSiliconT2',   icon:'silicon.png',   data:'siliconT2',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT3'] =   { id:'achSiliconT3',   icon:'silicon.png',   data:'siliconT3',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT4'] =   { id:'achSiliconT4',   icon:'silicon.png',   data:'siliconT4',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT5'] =   { id:'achSiliconT5',   icon:'silicon.png',   data:'siliconT5',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT1'] =   { id:'achUraniumT1',   icon:'uranium.png',   data:'uraniumT1',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT2'] =   { id:'achUraniumT2',   icon:'uranium.png',   data:'uraniumT2',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT3'] =   { id:'achUraniumT3',   icon:'uranium.png',   data:'uraniumT3',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT4'] =   { id:'achUraniumT4',   icon:'uranium.png',   data:'uraniumT4',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT5'] =   { id:'achUraniumT5',   icon:'uranium.png',   data:'uraniumT5',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT1'] =      { id:'achLavaT1',      icon:'lava.png',      data:'lavaT1',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT2'] =      { id:'achLavaT2',      icon:'lava.png',      data:'lavaT2',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT3'] =      { id:'achLavaT3',      icon:'lava.png',      data:'lavaT3',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT4'] =      { id:'achLavaT4',      icon:'lava.png',      data:'lavaT4',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT5'] =      { id:'achLavaT5',      icon:'lava.png',      data:'lavaT5',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT1'] =  { id:'achLunariteT1',  icon:'lunarite.png',  data:'lunariteT1',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT2'] =  { id:'achLunariteT2',  icon:'lunarite.png',  data:'lunariteT2',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT3'] =  { id:'achLunariteT3',  icon:'lunarite.png',  data:'lunariteT3',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT4'] =  { id:'achLunariteT4',  icon:'lunarite.png',  data:'lunariteT4',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT5'] =  { id:'achLunariteT5',  icon:'lunarite.png',  data:'lunariteT5',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT1'] =   { id:'achMethaneT1',   icon:'methane.png',   data:'methaneT1',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT2'] =   { id:'achMethaneT2',   icon:'methane.png',   data:'methaneT2',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT3'] =   { id:'achMethaneT3',   icon:'methane.png',   data:'methaneT3',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT4'] =   { id:'achMethaneT4',   icon:'methane.png',   data:'methaneT4',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT5'] =   { id:'achMethaneT5',   icon:'methane.png',   data:'methaneT5',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT1'] =  { id:'achTitaniumT1',  icon:'titanium.png',  data:'titaniumT1',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT2'] =  { id:'achTitaniumT2',  icon:'titanium.png',  data:'titaniumT2',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT3'] =  { id:'achTitaniumT3',  icon:'titanium.png',  data:'titaniumT3',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT4'] =  { id:'achTitaniumT4',  icon:'titanium.png',  data:'titaniumT4',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT5'] =  { id:'achTitaniumT5',  icon:'titanium.png',  data:'titaniumT5',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT1'] =      { id:'achGoldT1',      icon:'gold.png',      data:'goldT1',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT2'] =      { id:'achGoldT2',      icon:'gold.png',      data:'goldT2',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT3'] =      { id:'achGoldT3',      icon:'gold.png',      data:'goldT3',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT4'] =      { id:'achGoldT4',      icon:'gold.png',      data:'goldT4',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT5'] =      { id:'achGoldT5',      icon:'gold.png',      data:'goldT5',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT1'] =    { id:'achSilverT1',    icon:'silver.png',    data:'silverT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT2'] =    { id:'achSilverT2',    icon:'silver.png',    data:'silverT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT3'] =    { id:'achSilverT3',    icon:'silver.png',    data:'silverT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT4'] =    { id:'achSilverT4',    icon:'silver.png',    data:'silverT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT5'] =    { id:'achSilverT5',    icon:'silver.png',    data:'silverT5',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT1'] =  { id:'achHydrogenT1',  icon:'hydrogen.png',  data:'hydrogenT1',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT2'] =  { id:'achHydrogenT2',  icon:'hydrogen.png',  data:'hydrogenT2',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT3'] =  { id:'achHydrogenT3',  icon:'hydrogen.png',  data:'hydrogenT3',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT4'] =  { id:'achHydrogenT4',  icon:'hydrogen.png',  data:'hydrogenT4',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT5'] =  { id:'achHydrogenT5',  icon:'hydrogen.png',  data:'hydrogenT5',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT1'] =    { id:'achHeliumT1',    icon:'helium.png',    data:'heliumT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT2'] =    { id:'achHeliumT2',    icon:'helium.png',    data:'heliumT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT3'] =    { id:'achHeliumT3',    icon:'helium.png',    data:'heliumT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT4'] =    { id:'achHeliumT4',    icon:'helium.png',    data:'hel...[truncated for brevity]