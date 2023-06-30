/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @name validator_fields_CS
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@freebug.mx>
 * @summary ClientScript para el conotrol de datos obligatorios en el registro de campos nuevos
 * @copyright Tekiio México 2023
 * 
 * Client              -> Tekiio
 * Last modification   -> 29/06/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> Validator fields CS <ID del registro>
 */
define(['N/log'],
/**
 * @param{log} log
 */
function(log) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        try {
            var valuField_1 = scriptContext.currentRecord.getValue({
                fieldId: 'custrecord_fb_validator_field_level'
            });
            if (valuField_1 == true) {
                var objField = scriptContext.currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_sublist'
                });
                objField.isMandatory = true;
                objField.isDisabled = false;
            }else{
                var objField = scriptContext.currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_sublist'
                });
                objField.isMandatory = false;
                objField.isDisabled = true;
            }


            var valuField = scriptContext.currentRecord.getValue({
                fieldId: 'custrecord_fb_validator_field_type'
            });
            if (valuField != 12) {
                var objField_1 = scriptContext.currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_type_reg'
                });
                objField_1.isMandatory = false;
                objField_1.isDisabled = true;
                var objField_2 = scriptContext.currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_id_search'
                });
                objField_2.isMandatory = false;
                objField_2.isDisabled = true;
            }else{
                var objField_1 = scriptContext.currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_type_reg'
                });
                objField_1.isMandatory = true;
                objField_1.isDisabled = false;
                var objField_2 = scriptContext.currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_id_search'
                });
                objField_2.isMandatory = true;
                objField_2.isDisabled = false;
            }
        } catch (error) {
            console.error('PageInit', error);
        }
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        try {
            var campoChange = scriptContext.fieldId;
            if (campoChange == 'custrecord_fb_validator_field_type' || campoChange == 'custrecord_fb_validator_field_level') {
                console.log('CampoChange: ' + campoChange);
                var currentRecord = scriptContext.currentRecord;
                changeVisible(campoChange, currentRecord);
            }
        } catch (error) {
            log.error({title:'fieldChanged', details:error});
        }
    }
    function changeVisible(field, currentRecord) {
        try {
            var valuField = currentRecord.getValue({
                fieldId: field
            });
            console.log('function_field: ' + field + 'Value: '+ valuField);
            if (field == 'custrecord_fb_validator_field_level') {
                var objField = currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_sublist'
                });
                if (valuField == true) {
                    objField.isMandatory = true;
                    objField.isDisabled = false;
                }else{
                    objField.isMandatory = false;
                    objField.isDisabled = true;
                    currentRecord.setValue({
                        fieldId: 'custrecord_fb_validator_field_sublist',
                        value: ''
                    });
                }
            }
            if (field == 'custrecord_fb_validator_field_type') {
                var objFieldType = currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_type_reg'
                });
                var objFieldIdSearch = currentRecord.getField({
                    fieldId: 'custrecord_fb_validator_field_id_search'
                });
                if (valuField == 12) {
                    objFieldType.isMandatory = true;
                    objFieldType.isDisabled = false;
                    objFieldIdSearch.isMandatory = true;
                    objFieldIdSearch.isDisabled = false;
                }else{
                    objFieldType.isMandatory = false;
                    objFieldType.isDisabled = true;
                    currentRecord.setValue({
                        fieldId: 'custrecord_fb_validator_field_type_reg',
                        value: ''
                    });
                    objFieldIdSearch.isMandatory = false;
                    objFieldIdSearch.isDisabled = true;
                    currentRecord.setValue({
                        fieldId: 'custrecord_fb_validator_field_id_search',
                        value: ''
                    });
                }
            }
        } catch (error) {
            console.error({title:'changeVisible', details:error});
        }
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };
    
});
