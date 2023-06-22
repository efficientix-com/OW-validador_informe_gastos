/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 define(['N/runtime', 'N/log', 'N/redirect', 'N/record', 'N/search', 'N/file'], 
 function(runtime, log, redirect, record, search, file) {
 
     function beforeLoad(context) {
        try{
            // var checkRedirect = scriptObject.getParameter({name: 'custscript_tkio_redirect'})
            var scriptObject = runtime.getCurrentScript();
            var checkRedirect = scriptObject.getParameter({name: 'custscript_tkio_redirect'});
            log.audit({title:"check: ", details:checkRedirect});
            if(checkRedirect == true){
                var form = context.form;
                var currentRecord = context.newRecord;
                form.clientScriptModulePath = './XML_validator_ue_CS.js';
                
                var actualApprovalStatus = currentRecord.getValue({
                    fieldId: 'approvalstatus'
                });
                var complete = currentRecord.getValue({
                    fieldId: 'complete'
                });
                log.audit("complete",complete);
                var approvalStatus = scriptObject.getParameter({name: 'custscript_xml_approval_status'});
                var rejectStatus = scriptObject.getParameter({name: 'custscript_xml_reject_status'});
                if(context.type == context.UserEventType.VIEW && ((actualApprovalStatus == approvalStatus || actualApprovalStatus == rejectStatus) || !complete)){
                    form.addButton({
                        id: 'custpage_submit_approval',
                        label: getTranslationLabel('send_aproval_text'),
                        functionName: 'approve(' + approvalStatus +')'
                    });
                }
                var status = currentRecord.getValue({
                fieldId: 'status'
                });
        
                var userObj = runtime.getCurrentUser();
                
                log.audit("Status Report", status);
                log.audit("userObj.role",userObj.role);
                
                if((context.type == context.UserEventType.EDIT && (actualApprovalStatus != rejectStatus)) || context.type == context.UserEventType.CREATE){
                        redirect.toSuitelet({
                            scriptId: 'customscript_xml_val_sl' ,
                            deploymentId: 'customdeploy_xml_val_sl',
                            parameters: {'custparam_test':'helloWorld'} 
                        });
                    
                }
            }
         
     }catch(e){
        log.error({title:"Error beforeLoad: ", details:e})
     }
    }
    function beforeSubmit(context) {
        try {
            if (context.type == context.UserEventType.EDIT) {
                var newContext = context.newRecord;
                var oldContext = context.oldRecord;
                var lineCountOld = oldContext.getLineCount({sublistId: 'expense'});
                var lineCountNew = newContext.getLineCount({sublistId: 'expense'});
                // log.debug("Expenses", {lineCountOld: lineCountOld, lineCountNew: lineCountNew});
                if (lineCountOld>0) {
                    var oldPDF;
                    var newPDF;
                    var bandera = false;
                    for (var i = 0; i < lineCountOld; i++) {
                        oldPDF = oldContext.getSublistValue({ sublistId: 'expense', fieldId: 'custcol_xml_line_file_pdf', line: i });
                        for (var j = 0; j < lineCountNew; j++) {
                            newPDF = newContext.getSublistValue({sublistId: 'expense', fieldId: 'custcol_xml_line_file_pdf', line: j });
                            if (oldPDF == newPDF) {
                                // log.debug("NO CAMBIOS " + i + "-" + j, {oldPDF: oldPDF, newPDF: newPDF});
                                bandera = true;
                                j=lineCountNew;
                            }
                        }
                        if (bandera == false) {
                            oldPDF = oldContext.getSublistValue({ sublistId: 'expense', fieldId: 'custcol_xml_line_file_pdf', line: i }) || '';
                            var oldXML = oldContext.getSublistValue({ sublistId: 'expense', fieldId: 'custcol_xml_line_file_xml', line: i }) || '';
                            var UUID = oldContext.getSublistValue({ sublistId: 'expense', fieldId: 'custcol_xml_uuid', line: i }) || '';
                            log.audit('Datos eliminados', {oldPDF: oldPDF, oldXML: oldXML, UUID: UUID});
                            if (oldPDF != '') {
                                deleteData(oldPDF)
                            }
                            if (oldXML != '') {
                                deleteData(oldXML);
                            }
                            if (UUID != '') {
                                releaseUUID(UUID);
                            }
                        }
                        bandera = false;
                    }
                }
            }
        } catch (e) {
            log.error('beforeSubmit', e);
        }
    }

    function releaseUUID(txUUID) {
        try {
            var uuidReg = search.create({
                type: "customrecord_xml_used_uuid",
                filters:
                [
                   ["name","is",txUUID]
                ],
                columns:
                [
                   search.createColumn({
                      name: "name",
                      sort: search.Sort.ASC,
                      label: "Nombre"
                   }),
                   search.createColumn({name: "internalid", label: "ID interno"})
                ]
            });
            var searchResultCount = uuidReg.runPaged().count;
            if (searchResultCount>0) {
                uuidReg.run().each(function(result){
                        var idUUIDreg = result.getValue({name: 'internalid' });
                        // var nameUUIDreg = result.getValue({name: 'name' });
                        var featureRecord = record.delete({
                            type: 'customrecord_xml_used_uuid',
                            id: idUUIDreg,
                        });
                        // log.debug("Datos en reg UUID", {idUUIDreg: idUUIDreg, nameUUIDreg: nameUUIDreg, featureRecord: featureRecord});
                    return true;
                });
            }
        } catch (e) {
            log.error('releaseUUID', e);
        }
    }

    function deleteData(doc) {
        try {
            var idDeleted = file.delete({
                id: doc
            });
        } catch (e) {
            log.error('deleteData', e);
        }
    }
 
     function afterSubmit(context){
         var recordEP =  context.newRecord;
         log.audit("afterSubmit - type", context.type);
         if(context.type == context.UserEventType.REJECT){
             var result = search.create({
                 type: 'customrecord_xml_used_uuid',
                 filters: [
                     ['custrecord_xml_uuid_exp_rep', search.Operator.IS, recordEP.id],
                     'and',
                     ['custrecord_xml_uui_rejected', search.Operator.IS, false]
                 ],
                 columns: [
                     { name: 'name' }
                 ]
             });
             
             var resultData = result.run();
             
             var resultSet = resultData.getRange(0, 100);
             
             while(resultSet && resultSet.length){
                 for(var i = 0; i < resultSet.length; i++){
                     log.audit("afterSubmit - resultSet["+ i+ "].id", resultSet[i].id);
                     var id = resultSet[i].id;
                     record.submitFields({
                         type: 'customrecord_xml_used_uuid',
                         id: id,
                         values: {
                             custrecord_xml_uui_rejected: true
                         },
                         options: {
                             enableSourcing: false,
                             ignoreMandatoryFields : true
                         }
                     });
                 }
             }
         }
     }
 
     function getTranslationLabel(idField){
         var currentUser = runtime.getCurrentUser(),
             currentLang = currentUser.getPreference({name: "LANGUAGE"}),
             idLanguage = "";
             switch(currentLang){
                 case "es_AR":
                     idLanguage =  "custrecord_xml_la_text";
                 break;
                 case "es_ES":
                     idLanguage =  "custrecord_xml_spanish_text";
                 break;
                 case "en":
                     idLanguage = "custrecord_xml_en_int_text";
                 break;
                 case "en_AU":
                     idLanguage = "custrecord_xml_en_au_text";
                 break;
                 case "en_CA":
                     idLanguage = "custrecord_xml_en_ca_text";
                 break;
                 case "en_GB":
                     idLanguage = "custrecord_xml_en_uk_text";
                 break;
                 case "en_US":
                     idLanguage = "custrecord_xml_english_text";
                 break;
                 default:
                     idLanguage =  "custrecord_xml_la_text";
                 break;
             }
 
         var searchInfo = search.create({
             type: 'customrecord_xml_val_trans',
             filters: [
                 ['isinactive', search.Operator.IS, 'F'],
                 "AND",
                 ['name', search.Operator.IS, idField]
             ],
             columns: [
                 {name: idLanguage},
                 // { name: 'custrecord_xml_en_int_text' },
                 // { name: 'custrecord_xml_en_au_text' },
                 // { name: 'custrecord_xml_en_ca_text' },
                 // { name: 'custrecord_xml_en_uk_text' },
                 // { name: 'custrecord_xml_english_text' },
                 // { name: 'custrecord_xml_la_text' },
                 // { name: 'custrecord_xml_spanish_text' }
             ]
         });
         var resultSearch = searchInfo.run(),
             resultData = resultSearch.getRange(0,1),
             resultLabel = "";
             
         if(!resultData.length){
             resultLabel = 'No Label';
         }
         else{
             resultLabel = resultData[0].getValue({ name: idLanguage }) || 'No Label';;
         }
         return resultLabel;
     }
     return {
         beforeLoad: beforeLoad,
         beforeSubmit: beforeSubmit,
         afterSubmit: afterSubmit
     }
 });