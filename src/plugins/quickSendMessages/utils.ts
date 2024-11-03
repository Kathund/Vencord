/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { DataStore } from "@api/index";
import { useAwaiter } from "@utils/react";
import { UserStore } from "@webpack/common";

export interface SavedData {
    label: string,
    message: string,
    group: string | null,
}


const getDataKey = () => `QuickSend_Messages_${UserStore.getCurrentUser().id}`;

var savedDataCache: SavedData[] = [];

export function clearDataFromDataStore() {
    savedDataCache = [];
    DataStore.del(getDataKey());
    DataStore.set(getDataKey(), savedDataCache);
    return savedDataCache;
}

export function saveDataToDataStore(data: SavedData) {
    savedDataCache = savedDataCache.filter(cacheData => cacheData !== data).filter(cacheData => cacheData.label !== data.label);
    if ((data.group || "").length === 0) data.group = null;
    if (data.message.length > 0) savedDataCache.push(data);
    return DataStore.set(getDataKey(), savedDataCache);
}

export function getCachedData() {
    useAwaiter(() => DataStore.get<SavedData[]>(getDataKey()).then(dataStoreData => {
        if (!dataStoreData) return;
        savedDataCache = [];
        dataStoreData.forEach(data => savedDataCache.push({ label: data.label, message: data.message, group: data.group }));
    }));
    return savedDataCache;
}
