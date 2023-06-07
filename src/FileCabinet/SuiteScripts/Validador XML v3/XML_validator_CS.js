/**
 *@NApiVersion 2.x
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
        }
        else{
            var tranid ="N/A";
            var total = 0.0;
            var nonreimbursable = 0.0;
            var reimbursable = 0.0;
            var corporatecard = 0.0;
            var advance2 = 0.0;
            var amount = 0.0;
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