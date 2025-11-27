"use strict";
import { EntitySchema } from "typeorm";

export const Informe = new EntitySchema({
    name: "Informe",
    tableName: "informe",
    columns: {
        id_informe: {
            type: "int",
            primary: true,
            generated: true,
        },
        id_usuario: {
            type: "uuid",
            nullable: false,
        },
        fecha: {
            type: "timestamp",
            nullable: false,
            default: () => "CURRENT_TIMESTAMP",
        },
        descripcion: {
            type: "text",
            nullable: false,
        },
    },
    relations: {
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "id_usuario" },
            onDelete: "CASCADE",
        },
    },
});
