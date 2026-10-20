const day = (offset) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export const createSeed = () => {
  const customers = [
    ['c1', 'Amelia Hart', 'Hartwell Property Group', 'amelia@hartwell.example', '0412 555 018', 'Active', '14 Banksia Avenue, Brighton VIC'],
    ['c2', 'Marcus Lee', 'Lee Residential', 'marcus@leeresidential.example', '0403 555 441', 'Active', '8 Seaview Road, Sandringham VIC'],
    ['c3', 'Sophie Bennett', 'Bennett & Co.', 'sophie@bennettco.example', '0431 555 230', 'Active', '26 Grant Street, Richmond VIC'],
    ['c4', 'Oliver Chen', 'Chen Developments', 'oliver@chendevelopments.example', '0422 555 861', 'Active', '4 Orchard Lane, Glen Iris VIC'],
    ['c5', 'Priya Nair', 'Nair Family Trust', 'priya@nairtrust.example', '0408 555 292', 'Active', '19 Parkside Crescent, Camberwell VIC'],
    ['c6', 'Jack Wilson', 'Wilson Homes', 'jack@wilsonhomes.example', '0417 555 623', 'Active', '71 High Street, Kew VIC'],
    ['c7', 'Isabella Moore', 'Moore Property', 'isabella@mooreproperty.example', '0450 555 374', 'Active', '33 Church Street, Hawthorn VIC'],
    ['c8', 'Noah Patel', 'Patel & Sons', 'noah@patelsons.example', '0428 555 901', 'Active', '102 Albert Road, Toorak VIC'],
    ['c9', 'Charlotte Evans', 'Evans Living', 'charlotte@evansliving.example', '0411 555 559', 'Prospect', '6 Elm Grove, Malvern VIC'],
    ['c10', 'Ethan Brooks', 'Brooks Property', 'ethan@brooksproperty.example', '0433 555 675', 'Active', '55 Station Street, Balwyn VIC'],
  ].map(([id, name, company, email, phone, status, address], i) => ({ id, name, company, email, phone, status, address, lastInteraction: day(-i - 1), notes: '' }))

  const projects = [
    ['p1', 'Hartwell Family Residence', 'SL-24018', 'c1', '14 Banksia Avenue, Brighton VIC', 'Daniel Foster', 'In Progress', 'On Track', 68, 1280000, 940000, 532000, -28, 60],
    ['p2', 'Seaview Coastal Extension', 'SL-24022', 'c2', '8 Seaview Road, Sandringham VIC', 'Mia Thompson', 'In Progress', 'At Risk', 43, 760000, 612000, 388000, -4, 28],
    ['p3', 'Richmond Townhouse Renovation', 'SL-24011', 'c3', '26 Grant Street, Richmond VIC', 'Daniel Foster', 'In Progress', 'Delayed', 55, 495000, 422000, 301000, -18, -6],
    ['p4', 'Orchard Lane New Build', 'SL-24027', 'c4', '4 Orchard Lane, Glen Iris VIC', 'Luca Martin', 'Scheduled', 'On Track', 12, 1580000, 1210000, 210000, 35, 190],
    ['p5', 'Parkside Kitchen & Living', 'SL-24031', 'c5', '19 Parkside Crescent, Camberwell VIC', 'Mia Thompson', 'Planning', 'On Track', 8, 382000, 315000, 45000, 48, 142],
    ['p6', 'Kew Heritage Restoration', 'SL-23982', 'c6', '71 High Street, Kew VIC', 'Daniel Foster', 'In Progress', 'At Risk', 81, 895000, 721000, 684000, -12, 18],
    ['p7', 'Hawthorn Bathroom Upgrade', 'SL-24006', 'c7', '33 Church Street, Hawthorn VIC', 'Luca Martin', 'Completed', 'On Track', 100, 164000, 142000, 156000, -100, -22],
    ['p8', 'Toorak Ensuite & Wardrobe', 'SL-23975', 'c8', '102 Albert Road, Toorak VIC', 'Mia Thompson', 'On Hold', 'At Risk', 32, 276000, 228000, 187000, -45, 52],
    ['p9', 'Elm Grove Dual Occupancy', 'SL-24034', 'c9', '6 Elm Grove, Malvern VIC', 'Luca Martin', 'Planning', 'On Track', 5, 2140000, 1740000, 0, 76, 300],
    ['p10', 'Station Street Rear Extension', 'SL-23991', 'c10', '55 Station Street, Balwyn VIC', 'Daniel Foster', 'In Progress', 'On Track', 74, 548000, 461000, 398000, -30, 32],
  ].map(([id, name, reference, customerId, address, manager, status, health, progress, contractValue, budget, actualCost, startOffset, finishOffset]) => ({
    id, name, reference, customerId, address, manager, status, health, progress, originalContractValue: contractValue,
    contractValue, budget, committedCost: Math.round(budget * 0.78), actualCost, startDate: day(startOffset), endDate: day(finishOffset),
    risk: health === 'On Track' ? 'No current blockers' : health === 'Delayed' ? 'Overdue critical path task' : 'Milestone requires attention',
    documents: ['Signed construction contract', 'Architectural plans', 'Site inspection record'],
  }))

  const leads = [
    ['l1', 'Grace Thompson', 'Thompson Family', 'grace@thompson.example', '0402 555 125', 'Referral', 'New', 640000, 'Luca Martin', -1, 0, 'Extension'],
    ['l2', 'Liam Walker', 'Walker Property', 'liam@walker.example', '0413 555 884', 'Website', 'Qualified', 420000, 'Mia Thompson', 1, -2, 'Renovation'],
    ['l3', 'Zoe Robinson', 'Robinson Homes', 'zoe@robinson.example', '0438 555 619', 'Google Ads', 'Quote in Progress', 815000, 'Daniel Foster', 3, -5, 'New build'],
    ['l4', 'Arjun Singh', 'Singh Residential', 'arjun@singh.example', '0416 555 832', 'Existing Customer', 'Quote Sent', 295000, 'Mia Thompson', 0, -4, 'Renovation'],
    ['l5', 'Ella Davis', 'Davis & Family', 'ella@davis.example', '0409 555 241', 'Trade Partner', 'Won', 570000, 'Daniel Foster', -2, -10, 'Extension'],
    ['l6', 'William Scott', 'Scott Property Group', 'william@scott.example', '0420 555 073', 'Social Media', 'Contacted', 350000, 'Luca Martin', 2, -3, 'Bathroom'],
    ['l7', 'Mia Anderson', 'Anderson Living', 'mia@anderson.example', '0410 555 993', 'Referral', 'Qualified', 1100000, 'Daniel Foster', 5, -1, 'New build'],
    ['l8', 'Lucas Taylor', 'Taylor Projects', 'lucas@taylor.example', '0432 555 312', 'Website', 'Lost', 180000, 'Mia Thompson', -8, -12, 'Deck'],
    ['l9', 'Chloe White', 'White Property', 'chloe@white.example', '0451 555 008', 'Other', 'New', 265000, 'Luca Martin', 4, 0, 'Kitchen'],
    ['l10', 'Henry Martin', 'Martin Family Trust', 'henry@martin.example', '0427 555 104', 'Google Ads', 'Quote Sent', 735000, 'Daniel Foster', 2, -6, 'Extension'],
    ['l11', 'Ava Harris', 'Harris Homes', 'ava@harris.example', '0418 555 649', 'Referral', 'Contacted', 490000, 'Mia Thompson', -1, -7, 'Renovation'],
    ['l12', 'Noah Clark', 'Clark Property', 'noah.clark@example', '0405 555 209', 'Social Media', 'Won', 320000, 'Luca Martin', 6, -14, 'Bathroom'],
  ].map(([id, name, company, email, phone, source, stage, value, owner, followOffset, activityOffset, projectType]) => ({
    id, name, company, email, phone, source, stage, value, owner, followUp: day(followOffset), lastActivity: day(activityOffset),
    projectType, notes: id === 'l2' ? 'Client is awaiting a revised scope before progressing.' : '', customerId: null, projectId: null, activity: [],
  }))

  const tasks = [
    ['t1','Confirm window measurements','p1','Daniel Foster',-1,2,'High','In Progress'],
    ['t2','Electrical rough-in inspection','p1','Mia Thompson',3,3,'Critical','Not Started'],
    ['t3','Order kitchen cabinetry','p1','Luca Martin',-5,-2,'High','Blocked'],
    ['t4','Footing inspection','p2','Mia Thompson',-3,-1,'Critical','Not Started'],
    ['t5','Confirm coastal glazing delivery','p2','Daniel Foster',2,6,'High','In Progress'],
    ['t6','Complete framing stage','p3','Daniel Foster',-9,-6,'High','In Progress'],
    ['t7','Plumbing rough-in','p3','Luca Martin',-4,-2,'Medium','Not Started'],
    ['t8','Site establishment','p4','Luca Martin',28,30,'Medium','Not Started'],
    ['t9','Approve finish schedule','p4','Daniel Foster',16,19,'Low','Not Started'],
    ['t10','Finalise joinery selections','p5','Mia Thompson',10,14,'Medium','In Progress'],
    ['t11','Heritage facade review','p6','Daniel Foster',-2,1,'High','Blocked'],
    ['t12','Install engineered flooring','p6','Luca Martin',5,9,'Medium','Not Started'],
    ['t13','Practical completion walkthrough','p7','Luca Martin',-24,-22,'High','Completed'],
    ['t14','Confirm tile supplier lead time','p8','Mia Thompson',-6,-3,'High','Blocked'],
    ['t15','Client selections meeting','p8','Daniel Foster',12,12,'Medium','Not Started'],
    ['t16','Planning permit submission','p9','Luca Martin',30,33,'High','Not Started'],
    ['t17','Measure existing roofline','p10','Daniel Foster',-2,0,'Medium','In Progress'],
    ['t18','Install rear bi-fold doors','p10','Mia Thompson',8,11,'High','Not Started'],
    ['t19','Book building surveyor','p4','Daniel Foster',42,45,'Low','Not Started'],
    ['t20','Review site safety plan','p2','Luca Martin',1,1,'Critical','Not Started'],
  ].map(([id,title,projectId,owner,startOffset,dueOffset,priority,status]) => ({
    id, title, projectId, owner, startDate: day(startOffset), dueDate: day(dueOffset), priority, status,
    dependency: id === 't2' ? 't1' : '', notes: '',
  }))

  const quotes = [
    ['q1','QT-1048','c2','p2','Coastal extension construction works',760000,'Sent',-12,3],
    ['q2','QT-1051','c3','p3','Townhouse renovation - revised scope',495000,'Accepted',-30,-6],
    ['q3','QT-1054','c4','p4','New build - stage 1 estimate',1580000,'In Preparation',-2,40],
    ['q4','QT-1057','c5','p5','Kitchen and living renovation',382000,'Draft',0,45],
    ['q5','QT-1039','c7','p7','Bathroom upgrade works',164000,'Accepted',-75,-45],
    ['q6','QT-1060','c8','p8','Ensuite and wardrobe fitout',276000,'Sent',-8,4],
    ['q7','QT-1063','c1','p1','Additional landscape scope',46000,'Declined',-16,-2],
    ['q8','QT-1067','c10','p10','Rear extension works',548000,'Expired',-55,-20],
  ].map(([id,reference,customerId,projectId,description,amount,status,createdOffset,followOffset]) => ({
    id,reference,customerId,projectId,description,amount,status,createdDate:day(createdOffset),sentDate:day(createdOffset+1),expiryDate:day(createdOffset+30),followUp:day(followOffset),
  }))

  const variations = [
    ['v1','VO-208','p1','Upgrade to stone benchtop',12500,'Awaiting Approval',-3,2],
    ['v2','VO-211','p2','Additional coastal protection works',18400,'Priced',-4,7],
    ['v3','VO-195','p3','Structural beam adjustment',9200,'Approved',-18,5],
    ['v4','VO-214','p6','Restore original leadlight windows',7600,'Requested',-1,3],
    ['v5','VO-201','p10','Upgrade rear glazing package',14800,'Approved',-13,4],
  ].map(([id,reference,projectId,description,amount,status,requestOffset,scheduleImpact]) => ({
    id,reference,projectId,customerId:projects.find(p=>p.id===projectId).customerId,description,amount,status,requestDate:day(requestOffset),scheduleImpact:`${scheduleImpact} days`,
  }))
  projects.forEach(project => {
    const approved = variations.filter(v => v.projectId === project.id && v.status === 'Approved').reduce((sum,v) => sum + v.amount, 0)
    project.contractValue = project.originalContractValue + approved
  })

  const invoices = [
    ...[
      ['INV-3021','c1','p1',245000,100000,-42],
      ['INV-3024','c2','p2',112000,35000,-38],
      ['INV-3028','c3','p3',82500,0,-73],
      ['INV-3032','c4','p4',158000,0,20],
      ['INV-3036','c5','p5',42000,15000,3],
      ['INV-3040','c6','p6',96000,96000,-30],
      ['INV-3044','c7','p7',16400,16400,-55],
      ['INV-3047','c8','p8',28000,12000,-4],
      ['INV-3051','c10','p10',73500,0,8],
      ['INV-3054','c1','p1',56000,0,12],
      ['INV-3058','c2','p2',38500,0,-18],
      ['INV-3061','c3','p3',24000,6000,-25],
      ['INV-3065','c6','p6',47500,0,16],
      ['INV-3068','c10','p10',18700,0,28],
    ].map(([number,customerId,projectId,amount,paid,dueOffset],i) => ({
      id:`i${i+1}`, kind:'Invoice', number, customerId, projectId, supplier:'', issueDate:day(dueOffset-21), dueDate:day(dueOffset),
      amount, paid, status:paid>=amount?'Paid':dueOffset<0?'Overdue':paid>0?'Partially Paid':'Awaiting Payment',
    })),
    ...[
      ['BILL-881','Harbour Concrete Co.','p1',18400,0,4],
      ['BILL-884','Brighton Electrical','p2',12600,3000,9],
      ['BILL-889','Richmond Timber Supply','p3',22800,0,-12],
      ['BILL-892','Glen Iris Plumbing','p4',9600,9600,-15],
      ['BILL-897','Heritage Joinery Studio','p6',15700,0,18],
      ['BILL-901','Metro Waste & Site Services','p10',3200,0,-3],
    ].map(([number,supplier,projectId,amount,paid,dueOffset],i) => ({
      id:`b${i+1}`, kind:'Bill', number, customerId:projects.find(p=>p.id===projectId).customerId, projectId, supplier,
      issueDate:day(dueOffset-18), dueDate:day(dueOffset), amount, paid, status:paid>=amount?'Paid':dueOffset<0?'Overdue':paid>0?'Partially Paid':'Awaiting Payment',
    })),
  ]

  const emails = [
    ['e1','Amelia Hart','Revised construction quotation','Thanks for the updated scope. Could we review the stone benchtop option?', 'c1','p1',-1,true,true],
    ['e2','Marcus Lee','Site inspection confirmation','Confirming access for the footing inspection next week.', 'c2','p2',-2,false,false],
    ['e3','Sophie Bennett','Updated project drawings','Please find the architect notes for the kitchen layout.', 'c3','p3',-3,false,true],
    ['e4','Oliver Chen','Construction programme','Can you confirm the anticipated site start date?', 'c4','p4',-1,true,true],
    ['e5','Priya Nair','Cabinetry finish selection','We prefer the natural oak finish from the sample board.', 'c5','p5',-4,false,false],
    ['e6','Jack Wilson','Heritage window restoration','The original window frames are ready for inspection.', 'c6','p6',-2,true,true],
    ['e7','Isabella Moore','Practical completion documents','Thank you for a smooth handover.', 'c7','p7',-12,false,false],
    ['e8','Noah Patel','Variation approval required','Please send through the revised wardrobe dimensions.', 'c8','p8',-1,true,true],
    ['e9','Charlotte Evans','Initial project enquiry','We are exploring a dual occupancy build for our site.', 'c9',null,-5,false,false],
    ['e10','Ethan Brooks','Outstanding invoice reminder','Following up on the progress claim due this week.', 'c10','p10',-3,false,true],
    ['e11','Brighton Electrical','Electrical rough-in availability','Our crew can attend site on Thursday morning.', 'c2','p2',-2,false,false],
    ['e12','Amelia Hart','Walkthrough time confirmed','Friday at 10am works well for us.', 'c1','p1',-6,false,false],
  ].map(([id,sender,subject,body,customerId,projectId,offset,unread,followUp]) => ({
    id,sender,recipient:'projects@siteledger.example',subject,preview:body.slice(0,76),body,customerId,projectId,date:day(offset),unread,flagged:followUp,followUp,
  }))
  const events = [
    ['ev1','Electrical installation','p1',1,'Site inspection','Mia Thompson'],
    ['ev2','Footing inspection','p2',3,'Inspection','Daniel Foster'],
    ['ev3','Client selections meeting','p5',4,'Client meeting','Mia Thompson'],
    ['ev4','Concrete delivery','p4',6,'Delivery','Luca Martin'],
    ['ev5','Subcontractor coordination','p3',-1,'Coordination','Daniel Foster'],
    ['ev6','Heritage facade review','p6',2,'Inspection','Daniel Foster'],
    ['ev7','Plumbing inspection','p10',5,'Inspection','Mia Thompson'],
    ['ev8','Supplier delivery - tiles','p8',8,'Delivery','Luca Martin'],
    ['ev9','Practical completion walkthrough','p7',-3,'Client meeting','Luca Martin'],
    ['ev10','Site progress review','p1',7,'Project review','Daniel Foster'],
  ].map(([id,title,projectId,offset,type,owner]) => ({ id,title,projectId,date:day(offset),type,owner,time:'09:00' }))
  const activity = [
    ['New lead created','Grace Thompson enquired about a home extension','Leads','l1',-1],
    ['Quote sent','Coastal extension quotation sent to Marcus Lee','Quotes','q1',-2],
    ['Customer meeting scheduled','Selections meeting added to the project calendar','Schedule','ev3',-2],
    ['Project status updated','Station Street extension reached 74% completion','Projects','p10',-3],
    ['Variation submitted','Stone benchtop upgrade sent for approval','Quotes','v1',-3],
    ['Invoice overdue','Invoice INV-3028 is now overdue','Finance','i3',-1],
    ['Task completed','Practical completion walkthrough recorded','Schedule','t13',-2],
    ['Lead qualified','Liam Walker qualified for a renovation project','Leads','l2',-3],
    ['New project planned','Elm Grove dual occupancy added to pipeline','Projects','p9',-5],
    ['Payment received','Part payment received for invoice INV-3024','Finance','i2',-6],
    ['Email flagged','Heritage window restoration requires a response','Communications','e6',-2],
    ['Quote accepted','Richmond townhouse renovation quote accepted','Quotes','q2',-30],
    ['Milestone at risk','Footing inspection requires confirmation','Schedule','t4',-1],
    ['Customer updated','Handover records added to Moore Property','Customers','c7',-12],
    ['Bill due soon','Harbour Concrete bill due this week','Finance','b1',-1],
  ].map(([title,description,module,recordId,offset],i) => ({ id:`a${i+1}`,title,description,module,recordId,date:day(offset) }))
  const integrations = [
    { id:'buildxact',name:'Buildxact',purpose:'Construction projects, estimates, scheduling and job-cost information.',categories:['Projects','Leads','Estimates','Scheduling'],recordCount:42,warnings:1,lastSync:'Never',status:'DEMO MODE — NOT CONNECTED' },
    { id:'xero',name:'Xero',purpose:'Contacts, invoices, bills, payment information and accounting summaries.',categories:['Contacts','Invoices','Bills','Payments'],recordCount:36,warnings:0,lastSync:'Never',status:'DEMO MODE — NOT CONNECTED' },
    { id:'outlook',name:'Outlook',purpose:'Email, calendar events and customer follow-up workflows.',categories:['Email','Calendar','Follow-ups'],recordCount:22,warnings:0,lastSync:'Never',status:'DEMO MODE — NOT CONNECTED' },
  ]
  return { leads, customers, projects, tasks, quotes, variations, invoices, emails, events, activity, integrations, syncHistory:[{id:'sync-seed',provider:'Buildxact',operation:'Scheduled demo check',records:12,result:'Warning',message:'Sample warning: 1 project record has incomplete site details.',date:day(-1)}], drafts:[], settings:{companyName:'SiteLedger Construction',userName:'Jordan Taylor',currency:'AUD',theme:'Light',notifications:true} }
}

export { day }
