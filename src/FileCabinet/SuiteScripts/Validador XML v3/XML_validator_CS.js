/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/record'], function(search, record) {

    
    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var currentStep = currentRecord.getValue({
            fieldId: 'custparam_step'
        }) || 0;

        var msgs = currentRecord.getValue({
            fieldId: 'custpage_trans_msgs'
        }) || '{}';
        msgs = JSON.parse(msgs);

        switch(currentStep){
            case 'custpage_files':
                var hasInv = currentRecord.getValue({
                    fieldId: 'custpage_deductible'
                });
                console.log("hasInv", hasInv);
                var pdf = currentRecord.getValue({
                    fieldId: 'custpage_pdf'
                });
                console.log("pdf", pdf);
                var xml = currentRecord.getValue({
                    fieldId: 'custpage_xml'
                });
                console.log("xml", xml);

                if(!pdf ||  (!xml && hasInv)){
                    alert(msgs.attachfile);
                    return false;
                }
                var extPDF = pdf.split(".")[1];
                if((extPDF && extPDF != 'pdf') || !extPDF){
                    alert(msgs.pdftype);
                    return false;
                }
                var extXML = xml.split(".")[1];
                if(hasInv){
                    if((extXML && extXML != 'xml') || !extXML){
                        alert(msgs.xmltype);
                        return false;
                    }
                }
            break;

            case 'custpage_validating':
                var isValid = currentRecord.getValue({
                    fieldId: 'custpage_valid'
                });
                if(!isValid){
                    alert(msgs.noallow);
                    return isValid;
                }
            break;
            
        }

        return true; 
    }

    function setSummaryValues(currentRecord){
        var id = currentRecord.getValue({
            fieldId: 'custpage_expense_report'
        });
        var customData = customFieldsData();
        if(id != -1){
            var objRecord = record.load({
                type: record.Type.EXPENSE_REPORT, 
                id: id
            });
            var total = objRecord.getValue({
                fieldId: 'total'
            });
            var nonreimbursable = objRecord.getValue({
                fieldId: 'nonreimbursable'
            });
            var reimbursable = objRecord.getValue({
                fieldId: 'reimbursable'
            });
            var corporatecard = objRecord.getValue({
                fieldId: 'corporatecard'
            });
            var advance2 = objRecord.getValue({
                fieldId: 'advance2'
            });
            var amount = objRecord.getValue({
                fieldId: 'amount'
            });
            var tranid = objRecord.getValue({
                fieldId: 'tranid'
            });
            if (customData.sucess == true) {
                for (var newLineField = 0; newLineField < customData.data.length; newLineField++) {
                    var lineValues = customData.data[newLineField];
                    if (lineValues.nivelCampo == false) {
                        var valueFound = objRecord.getValue({
                            fieldId: lineValues.idNetsuite
                        });
                        lineValues['valorNetsuite'] = valueFound
                        lineValues['isDisabled'] = true;
                        customData.data[newLineField] = lineValues;
                    }
                }
            }
        }else{
            var tranid ="N/A";
            var total = 0.0;
            var nonreimbursable = 0.0;
            var reimbursable = 0.0;
            var corporatecard = 0.0;
            var advance2 = 0.0;
            var amount = 0.0;
            if (customData.sucess == true) {
                for (var newLineField = 0; newLineField < customData.data.length; newLineField++) {
                    var lineValues = customData.data[newLineField];
                    if (lineValues.isSelect) {
                        lineValues['valorNetsuite'] = -1;
                    }else{
                        lineValues['valorNetsuite'] = '';
                    }
                    lineValues['isDisabled'] = false;
                    customData.data[newLineField] = lineValues;
                }
            }
        }
        currentRecord.setValue({
            fieldId: 'custpage_expense_report_id',
            value: tranid
        });
        currentRecord.setValue({
            fieldId: 'custpage_summary_total',
            value: total || '0.0'
        });
        currentRecord.setValue({
            fieldId: 'custpage_summary_nonreimbursable',
            value: nonreimbursable || '0.0'
        });
        currentRecord.setValue({
            fieldId: 'custpage_summary_reimbursable',
            value: reimbursable || '0.0'
        });
        currentRecord.setValue({
            fieldId: 'custpage_summary_corporatecard',
            value: corporatecard || '0.0'
        });
        currentRecord.setValue({
            fieldId: 'custpage_summary_advance2',
            value: advance2 || '0.0'
        });
        currentRecord.setValue({
            fieldId: 'custpage_summary_amount',
            value: amount || '0.0'
        });
        if (customData.sucess == true) {
            customData.data.forEach(lineValues=>{
                console.log(lineValues);
                if (lineValues.nivelCampo == false) {
                    currentRecord.setValue({fieldId: `custpage_${lineValues.idTraduccion}`, value: lineValues.valorNetsuite});
                    var customField = currentRecord.getField({fieldId: `custpage_${lineValues.idTraduccion}`});
                    if (lineValues.isDisabled == true) {
                        customField.isDisabled = true;
                    }else{
                        customField.isDisabled = false;
                    }
                }
            })
        }
    }

    function customFieldsData() {
        var dataReturn = {sucess: false, error: '', data: []};
        try {
            var camposSearch = search.create({
                type: "customrecord_fb_validator_fields",
                filters:
                [
                   ["isinactive","is","F"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "internalid",
                      sort: search.Sort.ASC,
                      label: "ID interno"
                   }),
                   search.createColumn({name: "custrecord_fb_validator_field_id_trad", label: "Id de traducción"}),
                   search.createColumn({name: "custrecord_fb_validator_field_id_nets", label: "ID valor a setear"}),
                   search.createColumn({name: "custrecord_fb_validator_field_type", label: "Tipo de campo"}),
                   search.createColumn({name: "custrecord_fb_validator_field_type_reg", label: "Lista/Registro"}),
                   search.createColumn({name: "custrecord_fb_validator_field_mandatory", label: "Obligatorio"}),
                   search.createColumn({name: "custrecord_fb_validator_field_id_search", label: "ID valor a buscar"}),
                   search.createColumn({name: "custrecord_fb_validator_field_filters", label: "Filtros sobre el resultado"}),
                   search.createColumn({name: "custrecord_fb_validator_field_level", label: "Campo a nivel Linea"}),
                   search.createColumn({name: "custrecord_fb_validator_field_sublist", label: "Sublista"})
                ]
            });
            var camposResult = camposSearch.runPaged({
                pageSize: 1000
            });
            console.log("Campos nuevos",camposResult.count);
            var dataCampos = [];
            if (camposResult.count > 0) {
                camposResult.pageRanges.forEach(function(pageRange){
                    var myPage = camposResult.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result){
                        var idTraduccion = result.getValue({name: 'custrecord_fb_validator_field_id_trad'});
                        var idNetsuite = result.getValue({name: 'custrecord_fb_validator_field_id_nets'});
                        var tipoCampo = result.getValue({name: 'custrecord_fb_validator_field_type'});
                        var listaUse = result.getValue({name: 'custrecord_fb_validator_field_type_reg'}) || '';
                        var mandatory = result.getValue({name: 'custrecord_fb_validator_field_mandatory'});
                        var idSearch = result.getValue({name: 'custrecord_fb_validator_field_id_search'}) || '';
                        var extraFilter = result.getValue({name: 'custrecord_fb_validator_field_filters'});
                        var nivelCampo = result.getValue({name: 'custrecord_fb_validator_field_level'});
                        var sublista = result.getValue({name: 'custrecord_fb_validator_field_sublist'}) || '';
                        var tipoDeCampo = Number(tipoCampo);
                        var isSelect = false;
                        if (tipoDeCampo == 16 || tipoDeCampo == 12) {
                            isSelect = true;
                        }
                        dataCampos.push({idTraduccion: idTraduccion, idNetsuite: idNetsuite, idSearch: idSearch, tipoCampo:tipoCampo, listaUse: listaUse, mandatory: mandatory, filtros: extraFilter, isSelect: isSelect, nivelCampo: nivelCampo, sublista: sublista});
                    });
                });
                console.log({title:'dataCampos', details:dataCampos});
            }
            dataReturn.sucess = true;
            dataReturn.data = dataCampos;
        } catch (error) {
            console.error('customFieldsData', error);
            dataReturn.sucess = false;
            dataReturn.error = error
        }
        return dataReturn;
    }

    function fieldChanged(context) {
        var id = context.fieldId;
        var currentRecord = context.currentRecord;
        switch(id){
            case 'custpage_deductible':
                deductibleCheckboxChange(currentRecord);
            break;
            case 'custpage_expense_report':
                setSummaryValues(currentRecord);
            break;
        }
    }

    function deductibleCheckboxChange(currentRecord){
        var val = currentRecord.getValue({
            fieldId: 'custpage_deductible'
        });
        var fieldXML = currentRecord.getField({
            fieldId: 'custpage_xml'
        });
        console.log(val);
        fieldXML.isDisabled = !val;
        fieldXML.isDisplay = val;
       
    }

    
    return {
        saveRecord: saveRecord,
        fieldChanged: fieldChanged
    }
});