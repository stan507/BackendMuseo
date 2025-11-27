"use strict";
import { EntitySchema } from "typeorm";

export const Pregunta = new EntitySchema({
    name: "Pregunta",
    tableName: "pregunta",
    columns: {
        id_pregunta: {
            type: "int",
            primary: true,
            generated: true,
        },
        id_quizz: {
            type: "int",
            nullable: false,
        },
        titulo: {
            type: "varchar",
            length: 255,
            nullable: false,
        },
        texto: {
            type: "text",
            nullable: false,
        },
    },
    relations: {
        quizz: {
            type: "many-to-one",
            target: "Quizz",
            joinColumn: { name: "id_quizz" },
            onDelete: "CASCADE",
        },
    },
});
