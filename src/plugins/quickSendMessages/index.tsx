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

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings, Settings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { getCurrentChannel, insertTextIntoChatInputBox, sendMessage } from "@utils/discord";
import { openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { Button, Menu } from "@webpack/common";
import type { Channel, User } from "discord-types/general";

import { EditMessagesModal } from "./components/EditMessagesModal";
import { ManageMessageModal } from "./components/ManageMessageModal";
import { clearDataFromDataStore, getCachedData, SavedData } from "./utils";

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

function replaceVariables(template: string, variables: { [x: string]: string | number; }) {
    return template.replace(/\{(\w+)\}/g, (match: any, name: string) => !!variables[name] ? variables[name] : match);
}

function handleMessage(message: string) {
    const channel = getCurrentChannel();
    if (channel && Settings.plugins.QuickSendMessages.autoSend) return sendMessage(channel.id, { content: message });
    insertTextIntoChatInputBox(message);
}

function makeUserContextButtons(user: User) {
    const cachedData = getCachedData();
    if (cachedData.length === 0) return (<></>);
    const groups = {};
    cachedData.forEach(meow => {
        if (meow.group === null) return;
        if (groups[meow.group.toLowerCase().replaceAll(" ", "-")] === undefined) groups[meow.group.toLowerCase().replaceAll(" ", "-")] = [];
        groups[meow.group.toLowerCase().replaceAll(" ", "-")].push(meow);
    });
    return (
        <Menu.MenuItem label="Quick Send Message" key="quick-send-messages" id="quick-send-messages" >
            {cachedData.map(meow => {
                if (meow.group === null) {
                    return (
                        <Menu.MenuItem
                            id={meow.label.toLowerCase().replaceAll(" ", "-")}
                            label={meow.label}
                            action={() => handleMessage(replaceVariables(meow.message.replaceAll("\\n", "\n"), { userId: user.id }))}
                        />
                    );
                }
            })}
            {Object.keys(groups).map(group => {
                return (
                    <Menu.MenuItem label={group} key={`quick-send-messages-group-${group}`} id={`quick-send-messages-group-${group}`}>
                        {groups[group].map((meow: SavedData) => {
                            return (
                                <Menu.MenuItem
                                    id={meow.label.toLowerCase().replaceAll(" ", "-")}
                                    label={meow.label}
                                    action={() => handleMessage(replaceVariables(meow.message.replaceAll("\\n", "\n"), { userId: user.id }))}
                                />
                            );
                        })}
                    </Menu.MenuItem>
                );
            })}
        </Menu.MenuItem>
    );
}

const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: UserContextProps) => {
    if (!user) return;
    children.push(makeUserContextButtons(user));
};


const settings = definePluginSettings({
    new: {
        type: OptionType.COMPONENT,
        description: "Add new",
        component: () => (<Button onClick={() => openModal(props => (<ManageMessageModal props={props} title={"New Message"} />))}>Add New</Button>)
    },
    reset: {
        type: OptionType.COMPONENT,
        description: "Reset",
        component: () => (<Button onClick={clearDataFromDataStore}>Reset</Button>)
    },
    editMessages: {
        type: OptionType.COMPONENT,
        description: "Edit Messages",
        component: () => (<Button onClick={() => openModal(props => (<EditMessagesModal props={props} />))}>Edit Messages</Button>)
    }
});


export default definePlugin({
    name: "QuickSendMessages",
    authors: [Devs.Kathund],
    description: "Adds Message shortcuts to the user context menu.",
    dependencies: ["UserSettingsAPI"],
    settings,
    options: {
        autoSend: {
            name: "Auto Send Message",
            description: "If enabled, your messages will be send into the channel your in.",
            type: OptionType.BOOLEAN,
            default: false
        }
    },
    contextMenus: {
        "user-context": UserContextMenuPatch
    }
});
