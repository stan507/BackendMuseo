"use strict";
import { EntitySchema } from "typeorm";

export const Respuesta = new EntitySchema({
    name: "Respuesta",
    tableName: "respuesta",
    columns: {
        id_respuesta: {
            type: "int",
            primary: true,
            generated: true,
        },
        id_pregunta: {
            type: "int",
            nullable: false,
        },
        texto: {
            type: "text",
            nullable: false,
        },
        es_correcta: {
            type: "boolean",
            nullable: false,
            default: false,
        },
    },
    relations: {
        pregunta: {
            type: "many-to-one",
            target: "Pregunta",
            joinColumn: { name: "id_pregunta" },
            onDelete: "CASCADE",
        },
    },
});
