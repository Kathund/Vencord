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
import { findByPropsLazy } from "@webpack";
import { Button, FluxDispatcher, Menu, MessageActions } from "@webpack/common";
import type { Message, User } from "discord-types/general";

import { EditMessagesModal } from "./components/EditMessagesModal";
import { ManageMessageModal } from "./components/ManageMessageModal";
import { clearDataFromDataStore, getCachedData, SavedMessageData } from "./utils";

function replaceVariables(template: string, variables: { [x: string]: string | number; }): string {
    return template.replace(/\{(\w+)\}/g, (match: any, name: string) => !!variables[name] ? variables[name] : match);
}

function handleMessage(message: string, replyData?: { message: Message; }): void {
    const channel = getCurrentChannel();
    if (!channel) return;
    if (replyData) {
        FluxDispatcher.dispatch({
            type: "CREATE_PENDING_REPLY",
            channel,
            message: replyData.message,
            shouldMention: !Settings.plugins.NoReplyMention.enabled,
            showMentionToggle: true,
        });
        const PendingReplyStore = findByPropsLazy("getPendingReply");
        const reply = PendingReplyStore.getPendingReply(channel.id);
        if (Settings.plugins.QuickSendMessages.autoSend) return sendMessage(channel.id, { content: message }, void 0, MessageActions.getSendMessageOptionsForReply(reply)).then(() => {
            if (reply) FluxDispatcher.dispatch({ type: "DELETE_PENDING_REPLY", channelId: channel.id });
        });
        insertTextIntoChatInputBox(message);
    } else {
        if (Settings.plugins.QuickSendMessages.autoSend) return sendMessage(channel.id, { content: message });
        insertTextIntoChatInputBox(message);
    }
}

function cleanMessage(message: string, user: User): string {
    return replaceVariables(message.replaceAll("\\n", "\n"), { userId: user.id, userMention: `<@${user.id}>` });
}

function makeContextButtons(user: User, replyData?: { message: Message; }): React.JSX.Element {
    const cachedData = getCachedData();
    if (cachedData.length === 0) return (<></>);
    const groups: { [key: string]: SavedMessageData[]; } = {};
    cachedData.forEach(messageData => {
        if (messageData.group === null) return;
        const key = messageData.group.toLowerCase().replaceAll(" ", "-");
        if (groups[key] === undefined) groups[key] = [];
        groups[key].push(messageData);
    });
    return (
        <Menu.MenuItem label={`Quick Send Message${replyData ? " Reply" : ""}`} key="quick-send-messages" id="quick-send-messages" >
            {cachedData.map(messageData => {
                if (messageData.group === null) {
                    return (
                        <Menu.MenuItem
                            id={messageData.label.toLowerCase().replaceAll(" ", "-")}
                            label={messageData.label}
                            action={() => handleMessage(cleanMessage(messageData.message, user), replyData)}
                        />
                    );
                }
            })}
            {Object.keys(groups).map(groupData => {
                return (
                    <Menu.MenuItem label={groupData} key={`quick-send-messages-group-${groupData}`} id={`quick-send-messages-group-${groupData}`}>
                        {groups[groupData].map((messageData: SavedMessageData) => {
                            return (
                                <Menu.MenuItem
                                    id={messageData.label.toLowerCase().replaceAll(" ", "-")}
                                    label={messageData.label}
                                    action={() => handleMessage(cleanMessage(messageData.message, user), replyData)}
                                />
                            );
                        })}
                    </Menu.MenuItem>
                );
            })}
        </Menu.MenuItem>
    );
}

const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user: User; }): void => {
    if (!user) return;
    children.push(makeContextButtons(user));
};

const MessageContextMenuPatch: NavContextMenuPatchCallback = (children, { message }: { message: Message; }): void => {
    if (!message || !message.author) return;
    children.push(makeContextButtons(message.author, { message }));
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
    description: "Adds Message shortcuts to the user and message context menu.",
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
        "message": MessageContextMenuPatch,
        "user-context": UserContextMenuPatch
    }
});
