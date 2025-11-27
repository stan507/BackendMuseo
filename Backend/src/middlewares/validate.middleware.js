"use strict";

export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        
        const dataToValidate = req[source];

        
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, 
            stripUnknown: false, 
        });

        if (error) {
            // Extrae los mensajes de error de Joi
            const errorMessages = error.details.map((detail) => detail.message);
            return res.status(400).json({
                success: false,
                error: "Error de validación",
                details: errorMessages,
            });
        }

        next();
    };
};
