"use strict";
import { EntitySchema } from "typeorm";

export const Visita = new EntitySchema({
    name: "Visita",
    tableName: "visita",
    columns: {
        id_visita: {
            type: "int",
            primary: true,
            generated: true,
        },
        id_usuario: {
            type: "uuid",
            nullable: false,
        },
        id_exhibicion: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        fecha_visita: {
            type: "timestamp",
            nullable: false,
            default: () => "CURRENT_TIMESTAMP",
        },
    },
    relations: {
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "id_usuario" },
            onDelete: "CASCADE",
        },
        exhibicion: {
            type: "many-to-one",
            target: "Exhibicion",
            joinColumn: { name: "id_exhibicion" },
            onDelete: "CASCADE",
        },
    },
});
