# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20140801040556) do

  create_table "m_checkpeople", force: true do |t|
    t.integer  "tenkentantoshaCode"
    t.string   "tenkentantoshamei",        limit: 64
    t.integer  "tenkentantoshashubetuKbn"
    t.integer  "tenkentantoshashubetu"
    t.integer  "sakujyoFlg"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "m_housinginfos", force: true do |t|
    t.integer  "bukenCode"
    t.string   "bukenmei",          limit: 128
    t.integer  "saishusakuseiY"
    t.integer  "tenkenkaishiY"
    t.integer  "tenkenKbn"
    t.string   "memo1",             limit: 1024
    t.integer  "teishiFlg"
    t.integer  "tenkenteishiY"
    t.integer  "tenkenjyohoumuFlg"
    t.string   "memo2",             limit: 1024
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "m_inits", force: true do |t|
    t.string   "tenkenmei1",       limit: 64
    t.string   "tenkenmei2",       limit: 64
    t.string   "tenkenmei3",       limit: 64
    t.string   "tenkenmei4",       limit: 64
    t.string   "tenkenmei5",       limit: 64
    t.string   "tenkenmei6",       limit: 64
    t.string   "tenkenmei7",       limit: 64
    t.string   "tenkenmei8",       limit: 64
    t.string   "tenkenmei9",       limit: 64
    t.string   "tenkenmei10",      limit: 64
    t.string   "tenkenstatusmei1", limit: 64
    t.string   "tenkenstatusmei2", limit: 64
    t.string   "tenkenstatusmei3", limit: 64
    t.string   "tenkenstatusmei4", limit: 64
    t.string   "tenkenstatusmei5", limit: 64
    t.string   "hoshustatusmei1",  limit: 64
    t.string   "hoshustatusmei2",  limit: 64
    t.string   "hoshustatusmei3",  limit: 64
    t.string   "hoshustatusmei4",  limit: 64
    t.string   "hoshustatusmei5",  limit: 64
    t.string   "hoshustatusmei6",  limit: 64
    t.integer  "nendokaishiM"
    t.integer  "zennenY"
    t.integer  "tounenY"
    t.integer  "jinenY"
    t.integer  "kaishinendoM"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "m_kinds", force: true do |t|
    t.integer  "shubetuKbn"
    t.integer  "shubetu"
    t.string   "shubetumei", limit: 64
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "m_mentes", force: true do |t|
    t.integer  "youbi"
    t.integer  "kaishijikan"
    t.integer  "shuryojikan"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "m_orderingpatries", force: true do |t|
    t.integer  "hachushaCode"
    t.integer  "edaban"
    t.string   "hachushamei",      limit: 128
    t.string   "hachuPostno",      limit: 8
    t.string   "hachuAdrs",        limit: 128
    t.string   "hachuTelno",       limit: 64
    t.string   "hachuFaxno",       limit: 64
    t.string   "hachuTandoshamei", limit: 64
    t.integer  "sakujyoFlg"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "m_pwds", force: true do |t|
    t.integer  "uid"
    t.integer  "upass"
    t.integer  "tenkentantoshaCode"
    t.integer  "urole"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "m_sysstatuses", force: true do |t|
    t.integer  "sstatus"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

#  create_table "t_auth_users", force: true do |t|
#    t.string   "email",                  default: "", null: false
#    t.string   "encrypted_password",     default: "", null: false
#    t.string   "reset_password_token"
#    t.datetime "reset_password_sent_at"
#    t.datetime "remember_created_at"
#    t.integer  "sign_in_count",          default: 0,  null: false
#    t.datetime "current_sign_in_at"
#    t.datetime "last_sign_in_at"
#    t.string   "current_sign_in_ip"
#    t.string   "last_sign_in_ip"
#    t.datetime "created_at"
#    t.datetime "updated_at"
#  end
#
#  add_index "t_auth_users", ["email"], name: "index_t_auth_users_on_email", unique: true, using: :btree
#  add_index "t_auth_users", ["reset_password_token"], name: "index_t_auth_users_on_reset_password_token", unique: true, using: :btree

  create_table "t_check_infos", force: true do |t|
    t.integer  "bukenCode"
    t.integer  "hachushaCode"
    t.integer  "nendo"
    t.integer  "seikyuhouhou"
    t.integer  "setubishubetuKbn"
    t.integer  "setubishubetu"
    t.integer  "tenkenshubetuKbn"
    t.integer  "tenkenshubetu"
    t.integer  "nenkantenkenkaisu"
    t.integer  "tenkenyoteiM1"
    t.integer  "kaisumeisai"
    t.decimal  "keiyakukingaku1",            precision: 15, scale: 3
    t.decimal  "keiyakukingaku2",            precision: 15, scale: 3
    t.integer  "boukataishobututenkenkaisu"
    t.integer  "tenkentantosha1"
    t.integer  "tenkentantosha2"
    t.integer  "tenkentantosha3"
    t.integer  "tenkentantosha4"
    t.integer  "tenkentantosha5"
    t.integer  "tenkentantosha6"
    t.integer  "tenkentantosha7"
    t.integer  "tenkentantosha8"
    t.integer  "tenkentantosha9"
    t.integer  "tenkentantosha10"
    t.decimal  "gaichuhi1",                  precision: 15, scale: 3
    t.decimal  "gaichuhi2",                  precision: 15, scale: 3
    t.decimal  "gaichuhi3",                  precision: 15, scale: 3
    t.decimal  "gaichuhi4",                  precision: 15, scale: 3
    t.decimal  "gaichuhi5",                  precision: 15, scale: 3
    t.decimal  "gaichuhi6",                  precision: 15, scale: 3
    t.decimal  "gaichuhi7",                  precision: 15, scale: 3
    t.decimal  "gaichuhi8",                  precision: 15, scale: 3
    t.decimal  "gaichuhi9",                  precision: 15, scale: 3
    t.decimal  "gaichuhi10",                 precision: 15, scale: 3
    t.integer  "maintantosha"
    t.integer  "jinendotenkenY"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "t_chktrackrec_infos", force: true do |t|
    t.integer  "bukenCode"
    t.integer  "nendo"
    t.integer  "checkFlg"
    t.integer  "setubishubetuKbn"
    t.integer  "setubishubetu"
    t.integer  "tenkenshubetuKbn"
    t.integer  "tenkenshubetu"
    t.integer  "edaban"
    t.integer  "tenkenyoteiM"
    t.decimal  "keiyakukingaku",                precision: 15, scale: 3
    t.decimal  "gaichuhi",                      precision: 15, scale: 3
    t.date     "tenkenkanryoYMD"
    t.integer  "tenkenstatus"
    t.decimal  "jinko",                         precision: 5,  scale: 1
    t.integer  "hoshuumu"
    t.string   "biko",             limit: 1024
    t.integer  "hoshukanrenumu"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "t_housinginfos", force: true do |t|
    t.integer  "bukenCode"
    t.integer  "hachushaCode"
    t.integer  "nendo"
    t.string   "bukenmei",         limit: 128
    t.string   "bukenPostno",      limit: 8
    t.string   "bukenAdrs",        limit: 128
    t.string   "bukenTelno",       limit: 64
    t.string   "bukenFaxno",       limit: 64
    t.string   "bukenTandoshamei", limit: 64
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "t_repair_infos", force: true do |t|
    t.integer  "bukenCode"
    t.integer  "nendo"
    t.integer  "setubishubetuKbn"
    t.integer  "setubishubetu"
    t.integer  "tenkenshubetuKbn"
    t.integer  "tenkenshubetu"
    t.integer  "tenkenyoteiM"
    t.integer  "edaban"
    t.date     "haseiYMD"
    t.date     "hoshukanryoYMD"
    t.integer  "hoshuStatus"
    t.string   "mitumorinaiyou",   limit: 1024
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
