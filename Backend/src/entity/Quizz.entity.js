"use strict";
import { EntitySchema } from "typeorm";

export const Quizz = new EntitySchema({
    name: "Quizz",
    tableName: "quizz",
    columns: {
        id_quizz: {
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
        titulo: {
            type: "varchar",
            length: 255,
            nullable: false,
        },
        cant_preguntas: {
            type: "int",
            nullable: false,
        },
        es_activo: {
            type: "boolean",
            nullable: false,
            default: false,
        },
        fecha_creacion: {
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
