/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/currentRecord', 'N/url'], 
    function(record, currentRecord, url) {

    function pageInit(context) {
        
    }

    function approve(aproveStatus){
        var currentER = currentRecord.get();
        var recordER = record.load({
            type: record.Type.EXPENSE_REPORT, 
            id: currentER.id,
            isDynamic: true,
        });
        console.log(aproveStatus);  
        recordER.setValue({
            fieldId: 'approvalstatus',
            value: aproveStatus
        });
        recordER.setValue({
            fieldId: 'complete',
            value: true
        });
        recordER.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        var output = url.resolveRecord({
            recordType: record.Type.EXPENSE_REPORT,
            recordId: currentER.id,
            isEditMode: false
        });

        window.open(output, '_self');
    }

    return {
        pageInit: pageInit,
        approve: approve
    }
});