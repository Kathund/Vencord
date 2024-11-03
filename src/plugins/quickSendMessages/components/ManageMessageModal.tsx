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

import { ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot } from "@utils/modal";
import { Button, Forms, React, TextInput } from "@webpack/common";

import { saveDataToDataStore } from "../utils";

export function ManageMessageModal({ props, title, currentLabel, currentMessage, edit }: { props: ModalProps; title: string; currentLabel?: string; currentMessage?: string; edit?: boolean; }) {

    const [label, setLabel] = React.useState(currentLabel ?? "");
    const [message, setMessage] = React.useState(currentMessage ?? "");

    function saveData() {
        saveDataToDataStore({ label, message });
        props.onClose();
    }

    function deleteMessage() {
        saveDataToDataStore({ label, message: "" });
        props.onClose();
    }

    return (
        <ModalRoot {...props}>
            <ModalHeader>
                <Forms.FormTitle tag="h4">{title}</Forms.FormTitle>
            </ModalHeader>
            <ModalContent>
                <Forms.FormTitle tag="h5" style={{ marginTop: "10px" }}>Button Title</Forms.FormTitle>
                <TextInput style={{ marginBottom: "10px" }} placeholder={"Title of the button you click"} value={label} onChange={setLabel} />
            </ModalContent>
            <ModalContent>
                <Forms.FormTitle tag="h5" style={{ marginTop: "10px" }}>Button Message</Forms.FormTitle>
                <TextInput style={{ marginBottom: "10px" }} placeholder={"Message to be sent"} value={message} onChange={setMessage} />
            </ModalContent>
            <ModalFooter>
                <Button color={Button.Colors.BRAND} onClick={saveData}>Save</Button>
                <Button color={Button.Colors.TRANSPARENT} look={Button.Looks.LINK} onClick={() => props.onClose()}>Cancel</Button>
                {edit === true ? <Button color={Button.Colors.TRANSPARENT} look={Button.Looks.LINK} onClick={deleteMessage}>Delete</Button> : null}
            </ModalFooter>
        </ModalRoot >
    );
}
