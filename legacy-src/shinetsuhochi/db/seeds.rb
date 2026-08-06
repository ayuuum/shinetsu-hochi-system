# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
require "csv"

CSV.foreach('db/csv/M_CHECKPERSON.csv') do |row|
@sakujyoFlg = (row[3] == "TRUE") ? 1 : 0
  MCheckperson.create(:tenkentantoshaCode => row[0],
                :tenkentantoshamei => row[1],
                :tenkentantoshashubetuKbn => 0,
                :tenkentantoshashubetu => row[2],
                :sakujyoFlg => @sakujyoFlg)#"FALSE, TRUE→0,1にできるか?"
end

CSV.foreach('db/csv/M_ORDERINGPATRY.csv') do |row|
	@sakujyoFlg = (row[8] == "TRUE") ? 1 : 0
  MOrderingpatry.create(:hachushaCode => row[0],
                :edaban => row[1],
                :hachushamei => row[2],
                :hachuPostno => row[3],
                :hachuAdrs => row[4],
                :hachuTelno => row[5],
                :hachuFaxno => row[6],
                :hachuTandoshamei => row[7],
                :sakujyoFlg => @sakujyoFlg)#"FALSE, TRUE→0,1にできるか?"
end

CSV.foreach('db/csv/M_HOUSINGINFO.csv') do |row|
@teishiFlg = (row[6] == "TRUE") ? 1 : 0
@tenkenjyohoumuFlg = (row[8] == "TRUE") ? 1 : 0
  MHousinginfo.create(:bukenCode => row[0],
                :bukenmei => row[1],
                :saishusakuseiY => row[2],
                :tenkenkaishiY => row[3],
                :tenkenKbn => row[4],
                :memo1 => row[5],
                :teishiFlg => @teishiFlg,#"FALSE, TRUE→0,1にできるか?"
                :tenkenteishiY => row[7],
                :tenkenjyohoumuFlg => @tenkenjyohoumuFlg,#"FALSE, TRUE→0,1にできるか?"
                :memo2 => row[9])
end

CSV.foreach('db/csv/T_HOUSINGINFO.csv') do |row|
  THousinginfo.create(:bukenCode => row[0],
                :hachushaCode => row[1],
                :nendo => row[2],
                :bukenmei => row[3],
                :bukenPostno => row[4],
                :bukenAdrs => row[5],
                :bukenTelno => row[6],
                :bukenFaxno => row[7],
                :bukenTandoshamei => row[8])
end


CSV.foreach('db/csv/T_CHECK_INFO.csv') do |row|
  TCheckInfo.create(:bukenCode => row[0],
                :hachushaCode => row[1],
                :nendo => row[2],
                :seikyuhouhou => row[3],
                :setubishubetuKbn => 1,
                :setubishubetu => row[5],
                :tenkenshubetuKbn => 2,
                :tenkenshubetu => row[6],
                :nenkantenkenkaisu => row[7],
                :tenkenyoteiM1 => row[8],
                :kaisumeisai => row[9],
                :keiyakukingaku1 => row[10].delete("\\").delete(","),
                :keiyakukingaku2 => row[11].delete("\\").delete(","),
                :boukataishobututenkenkaisu => row[12],
                :tenkentantosha1 => row[13],
                :tenkentantosha2 => row[14],
                :tenkentantosha3 => row[15],
                :tenkentantosha4 => row[16],
                :tenkentantosha5 => row[17],
                :tenkentantosha6 => 0,
                :tenkentantosha7 => 0,
                :tenkentantosha8 => 0,
                :tenkentantosha9 => 0,
                :tenkentantosha10 => 0,
                :gaichuhi1 => row[18].delete("\\").delete(","),
                :gaichuhi2 => row[19].delete("\\").delete(","),
                :gaichuhi3 => row[20].delete("\\").delete(","),
                :gaichuhi4 => row[21].delete("\\").delete(","),
                :gaichuhi5 => row[22].delete("\\").delete(","),
                :gaichuhi6 => 0,
                :gaichuhi7 => 0,
                :gaichuhi8 => 0,
                :gaichuhi9 => 0,
                :gaichuhi10 => 0,
                :maintantosha => row[23],
                :jinendotenkenY => 0)
end

CSV.foreach('db/csv/T_CHKTRACKREC_INFO.csv') do |row|
  TChktrackrecInfo.create(:bukenCode => row[0],
                :nendo => row[1],
                :checkFlg => row[2],
                :setubishubetuKbn => 1,
                :setubishubetu => row[3],
                :tenkenshubetuKbn => 2,
                :tenkenshubetu => row[4],
                :edaban => row[5],
                :tenkenyoteiM => row[6],
                :keiyakukingaku => row[7].delete("\\").delete(","),
                :gaichuhi => row[8].delete("\\").delete(","),
                :tenkenkanryoYMD => row[9].to_s.gsub("/","-"),
                :tenkenstatus => row[10],
                :jinko => row[11],
                :hoshuumu => row[12],
                :biko => row[13],
                :hoshukanrenumu => row[15])
end

CSV.foreach('db/csv/T_REPAIR_INFO.csv') do |row|
  TRepairInfo.create(:bukenCode => row[0],
                :nendo => row[1],
                :setubishubetuKbn => 1,
                :setubishubetu => row[2],
                :tenkenshubetuKbn => 2,
                :tenkenshubetu => row[3],
                :tenkenyoteiM => row[4],
                :edaban => row[5],
                :haseiYMD => row[6],
                :hoshukanryoYMD => nil,
                :hoshuStatus => row[7],
                :mitumorinaiyou => row[8])
end

